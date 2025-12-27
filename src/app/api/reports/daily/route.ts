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
    const customerId = searchParams.get('customer_id')
    const metalType = searchParams.get('metal_type')

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
    if (customerId) {
      invoiceQuery = invoiceQuery.eq('customer_id', customerId)
    }

    const { data: invoices, error: invoicesError } = await invoiceQuery.order('created_at', {
      ascending: false,
    })

    if (invoicesError) {
      return NextResponse.json({ error: invoicesError.message }, { status: 500 })
    }

    if (!invoices || invoices.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Get invoice items for all invoices
    const invoiceIds = invoices.map((inv) => inv.id)
    const { data: invoiceItems, error: itemsError } = await supabase
      .from(TABLES.INVOICE_ITEMS)
      .select(
        `
        *,
        item:${TABLES.ITEMS}(metal_type)
      `
      )
      .in('invoice_id', invoiceIds)

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
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

    // Filter by metal type if specified
    let filteredInvoices = invoices
    if (metalType) {
      filteredInvoices = invoices.filter((invoice) => {
        const items = itemsByInvoice.get(invoice.id) || []
        return items.some((item: any) => item.item?.metal_type === metalType)
      })
    }

    // Group by date
    const dailyData = new Map<string, any>()

    filteredInvoices.forEach((invoice) => {
      const date = new Date(invoice.created_at).toISOString().split('T')[0]
      const existing = dailyData.get(date) || {
        date,
        total_invoices: 0,
        total_revenue: 0,
        total_gst: 0,
        total_gold_value: 0,
        total_making_charges: 0,
      }

      existing.total_invoices += 1
      existing.total_revenue += parseFloat(invoice.total_amount.toString())
      existing.total_gst += parseFloat(invoice.gst_amount.toString())
      existing.total_gold_value += parseFloat(invoice.gold_value.toString())
      existing.total_making_charges += parseFloat(
        invoice.making_charges.toString()
      )

      dailyData.set(date, existing)
    })

    const reports = Array.from(dailyData.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    return NextResponse.json({ data: reports })
  } catch (error) {
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

