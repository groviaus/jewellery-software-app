import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-api'
import { TABLES } from '@/lib/constants'

export async function GET(request: Request) {
  try {
    const { user, supabase } = await getAuthenticatedUser()

    if (!user || !supabase) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Get invoices first
    let invoiceQuery = supabase
      .from(TABLES.INVOICES)
      .select('*')
      .eq('user_id', user.id)

    if (startDate) {
      invoiceQuery = invoiceQuery.gte('created_at', `${startDate}T00:00:00`)
    }
    if (endDate) {
      invoiceQuery = invoiceQuery.lte('created_at', `${endDate}T23:59:59`)
    }

    const { data: invoices, error: invoicesError } = await invoiceQuery.order('created_at', {
      ascending: false,
    })

    if (invoicesError) {
      return NextResponse.json({ error: invoicesError.message }, { status: 500 })
    }

    if (!invoices || invoices.length === 0) {
      return NextResponse.json({
        data: {
          total_revenue: 0,
          total_cost: 0,
          total_profit: 0,
          profit_margin: 0,
          by_metal_type: [],
        },
      })
    }

    // Get invoice items for all invoices
    const invoiceIds = invoices.map((inv) => inv.id)
    
    if (invoiceIds.length === 0) {
      return NextResponse.json({
        data: {
          total_revenue: 0,
          total_cost: 0,
          total_profit: 0,
          profit_margin: 0,
          by_metal_type: [],
        },
      })
    }
    
    const { data: invoiceItems, error: itemsError } = await supabase
      .from(TABLES.INVOICE_ITEMS)
      .select(
        `
        *,
        item:${TABLES.ITEMS}(metal_type, net_weight, making_charge)
      `
      )
      .in('invoice_id', invoiceIds)

    if (itemsError) {
      console.error('Error fetching invoice items:', itemsError)
      return NextResponse.json({ 
        error: `Failed to fetch invoice items: ${itemsError.message}` 
      }, { status: 500 })
    }

    // Group invoice items by invoice_id
    const itemsByInvoice = new Map<string, any[]>()
    invoiceItems?.forEach((item: any) => {
      const invoiceId = item.invoice_id
      if (!itemsByInvoice.has(invoiceId)) {
        itemsByInvoice.set(invoiceId, [])
      }
      itemsByInvoice.get(invoiceId)!.push(item)
    })

    // Calculate profit margins
    let totalRevenue = 0
    let totalCost = 0
    let totalProfit = 0
    const profitByMetalType: Record<string, { revenue: number; cost: number; profit: number }> = {}

    invoices.forEach((invoice) => {
      const invoiceRevenue = parseFloat(invoice.total_amount.toString())
      totalRevenue += invoiceRevenue

      let invoiceCost = 0
      const items = itemsByInvoice.get(invoice.id) || []
      
      items.forEach((item: any) => {
        // Estimate cost: 80% of revenue (conservative estimate)
        // In a real scenario, you'd want to track actual cost_price
        const itemRevenue = parseFloat(item.price.toString()) * item.quantity
        const itemCost = itemRevenue * 0.8 // Estimated cost at 80% of revenue
        invoiceCost += itemCost

        const metalType = item.item?.metal_type || 'Unknown'
        if (!profitByMetalType[metalType]) {
          profitByMetalType[metalType] = { revenue: 0, cost: 0, profit: 0 }
        }
        profitByMetalType[metalType].revenue += itemRevenue
        profitByMetalType[metalType].cost += itemCost
        profitByMetalType[metalType].profit += itemRevenue - itemCost
      })

      totalCost += invoiceCost
      totalProfit += invoiceRevenue - invoiceCost
    })

    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

    const profitByMetalArray = Object.entries(profitByMetalType).map(([metalType, data]) => ({
      metal_type: metalType,
      revenue: data.revenue,
      cost: data.cost,
      profit: data.profit,
      margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0,
    }))

    return NextResponse.json({
      data: {
        total_revenue: totalRevenue,
        total_cost: totalCost,
        total_profit: totalProfit,
        profit_margin: profitMargin,
        by_metal_type: profitByMetalArray,
      },
    })
  } catch (error) {
    console.error('Error in profit margin report:', error)
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

