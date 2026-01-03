export type MetalType = 'Gold' | 'Silver' | 'Diamond'
export type Purity = '22K' | '18K' | '14K' | '24K' | '925' | 'Other'
export type MakingChargeType = 'fixed' | 'percentage'

export interface Item {
  id: string
  user_id: string
  name: string
  metal_type: MetalType
  purity: Purity
  gross_weight: number
  net_weight: number
  making_charge: number
  making_charge_type: MakingChargeType
  quantity: number
  sku: string
  created_at: string
  updated_at: string
}

export interface ItemFormData {
  name: string
  metal_type: MetalType
  purity: Purity
  gross_weight: number
  net_weight: number
  making_charge: number
  making_charge_type: MakingChargeType
  quantity: number
  sku: string
}

