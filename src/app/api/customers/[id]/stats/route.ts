import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-api'
import { TABLES } from '@/lib/constants'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { user, supabase } = await getAuthenticatedUser()

    if (!user || !supabase) {
      return unauthorizedResponse()
    }

    // Verify customer belongs to user
    const { data: customer } = await supabase
      .from(TABLES.CUSTOMERS)
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Get invoices for this customer
    const { data: invoices, error: invoicesError } = await supabase
      .from(TABLES.INVOICES)
      .select('total_amount, created_at')
      .eq('customer_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (invoicesError) {
      return NextResponse.json({ error: invoicesError.message }, { status: 500 })
    }

    const totalPurchaseValue = (invoices || []).reduce(
      (sum, inv) => sum + parseFloat(inv.total_amount.toString()),
      0
    )
    const purchaseCount = (invoices || []).length
    const lastPurchaseDate = (invoices || [])[0]?.created_at || null

    return NextResponse.json({
      data: {
        total_purchase_value: totalPurchaseValue,
        purchase_count: purchaseCount,
        last_purchase_date: lastPurchaseDate,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

