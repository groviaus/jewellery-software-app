import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-api'
import { TABLES } from '@/lib/constants'

export async function GET() {
  try {
    const { user, supabase } = await getAuthenticatedUser()

    if (!user || !supabase) {
      return unauthorizedResponse()
    }

    const { data, error } = await supabase
      .from(TABLES.ITEMS)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
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
    const { name, metal_type, purity, gross_weight, net_weight, making_charge, making_charge_type, quantity, sku } =
      body

    // Validate required fields
    if (!name || !metal_type || !purity || !sku) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if SKU already exists for this user
    const { data: existing } = await supabase
      .from(TABLES.ITEMS)
      .select('id')
      .eq('user_id', user.id)
      .eq('sku', sku)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'SKU already exists' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from(TABLES.ITEMS)
      .insert({
        user_id: user.id,
        name,
        metal_type,
        purity,
        gross_weight: parseFloat(gross_weight),
        net_weight: parseFloat(net_weight),
        making_charge: parseFloat(making_charge),
        making_charge_type: making_charge_type || 'percentage',
        quantity: parseInt(quantity),
        sku,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

