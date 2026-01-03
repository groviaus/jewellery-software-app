import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-api'
import { TABLES } from '@/lib/constants'
import {
  calculateGoldValue,
  calculateMakingCharges,
  calculateGST,
  calculateGrandTotal,
  generateInvoiceNumber,
} from '@/lib/utils/calculations'

export async function GET(request: Request) {
  try {
    const { user, supabase } = await getAuthenticatedUser()

    if (!user || !supabase) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    let query = supabase
      .from(TABLES.INVOICES)
      .select(
        `
        *,
        customer:${TABLES.CUSTOMERS}(name, phone)
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (from) {
      query = query.gte('created_at', from)
    }

    if (to) {
      query = query.lte('created_at', to)
    }

    if (limit) {
      query = query.limit(parseInt(limit))
    }

    const { data: invoices, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: invoices || [] })
  } catch (error) {
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await getAuthenticatedUser()

    if (!user || !supabase) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { customer_id, items, gold_rate, discount_type, discount_value } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    if (!gold_rate || gold_rate <= 0) {
      return NextResponse.json(
        { error: 'Valid gold rate is required' },
        { status: 400 }
      )
    }

    // Get GST rate from settings
    const { data: settings } = await supabase
      .from(TABLES.STORE_SETTINGS)
      .select('gst_rate')
      .eq('user_id', user.id)
      .single()

    const gstRate = settings?.gst_rate || 3.0

    // Calculate totals
    let totalGoldValue = 0
    let totalMakingCharges = 0

    // Get the latest invoice number to generate next
    const { data: lastInvoice } = await supabase
      .from(TABLES.INVOICES)
      .select('invoice_number')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let invoiceNumber = 'INV-001'
    if (lastInvoice?.invoice_number) {
      const lastNum = parseInt(lastInvoice.invoice_number.split('-')[1])
      invoiceNumber = generateInvoiceNumber(lastNum + 1)
    }

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from(TABLES.INVOICES)
      .insert({
        user_id: user.id,
        customer_id: customer_id || null,
        invoice_number: invoiceNumber,
        total_amount: 0, // Will update after calculating
        gst_amount: 0,
        gold_value: 0,
        making_charges: 0,
        discount_type: discount_type || null,
        discount_value: discount_value || 0,
      })
      .select()
      .single()

    if (invoiceError) {
      return NextResponse.json(
        { error: invoiceError.message },
        { status: 500 }
      )
    }

    // Process items and create invoice items
    for (const cartItem of items) {
      const { data: item } = await supabase
        .from(TABLES.ITEMS)
        .select('*')
        .eq('id', cartItem.item_id)
        .eq('user_id', user.id)
        .single()

      if (!item) {
        // Rollback invoice
        await supabase.from(TABLES.INVOICES).delete().eq('id', invoice.id)
        return NextResponse.json(
          { error: `Item ${cartItem.item_id} not found` },
          { status: 404 }
        )
      }

      // Check stock
      if (item.quantity < cartItem.quantity) {
        await supabase.from(TABLES.INVOICES).delete().eq('id', invoice.id)
        return NextResponse.json(
          { error: `Insufficient stock for ${item.name}` },
          { status: 400 }
        )
      }

      const weight = cartItem.weight || item.net_weight
      const goldValue = calculateGoldValue(weight, gold_rate)
      const makingCharges = calculateMakingCharges(weight, item.making_charge)
      const price = goldValue + makingCharges

      totalGoldValue += goldValue * cartItem.quantity
      totalMakingCharges += makingCharges * cartItem.quantity

      // Create invoice item
      await supabase.from(TABLES.INVOICE_ITEMS).insert({
        invoice_id: invoice.id,
        item_id: item.id,
        quantity: cartItem.quantity,
        weight: weight,
        price: price,
      })

      // Reduce stock
      await supabase
        .from(TABLES.ITEMS)
        .update({
          quantity: item.quantity - cartItem.quantity,
        })
        .eq('id', item.id)
        .eq('user_id', user.id)
    }

    // Calculate final totals
    const subtotal = totalGoldValue + totalMakingCharges

    // Calculate discount
    let discountAmount = 0
    if (discount_value && discount_value > 0) {
      if (discount_type === 'percentage') {
        discountAmount = (subtotal * discount_value) / 100
      } else {
        discountAmount = discount_value
      }
    }

    const afterDiscount = subtotal - discountAmount
    const gstAmount = calculateGST(afterDiscount, 0, gstRate)
    const grandTotal = afterDiscount + gstAmount

    // Update invoice with final totals
    const { data: updatedInvoice, error: updateError } = await supabase
      .from(TABLES.INVOICES)
      .update({
        total_amount: grandTotal,
        gst_amount: gstAmount,
        gold_value: totalGoldValue,
        making_charges: totalMakingCharges,
        discount_type: discount_type || null,
        discount_value: discount_value || 0,
      })
      .eq('id', invoice.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: updatedInvoice })
  } catch (error) {
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

