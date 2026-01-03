export interface Invoice {
  id: string
  user_id: string
  customer_id: string | null
  invoice_number: string
  total_amount: number
  gst_amount: number
  gold_value: number
  making_charges: number
  discount_type?: 'percentage' | 'fixed' | null
  discount_value?: number
  created_at: string
  customer?: {
    name: string
    phone: string
  }
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  item_id: string
  quantity: number
  weight: number
  price: number
  created_at: string
  item?: {
    name: string
    sku: string
    metal_type: string
    purity: string
  }
}

export interface CartItem {
  item_id: string
  item: {
    id: string
    name: string
    sku: string
    metal_type: string
    purity: string
    net_weight: number
    making_charge: number
    making_charge_type: 'fixed' | 'percentage'
    quantity: number
  }
  quantity: number
  weight: number
  gold_rate?: number
  gold_value: number
  making_charges: number
  subtotal: number
}

export interface BillingFormData {
  customer_id: string | null
  items: CartItem[]
  gold_rate?: number
}

