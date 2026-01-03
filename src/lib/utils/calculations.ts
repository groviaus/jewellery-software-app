/**
 * Calculate gold value based on weight and gold rate
 */
export function calculateGoldValue(weight: number, goldRate: number): number {
  return weight * goldRate
}

/**
 * Calculate making charges
 * @param weight - Weight in grams
 * @param makingChargeValue - Either fixed amount per gram or percentage
 * @param makingChargeType - 'fixed' for per gram amount, 'percentage' for % of gold value
 * @param goldValue - Required when using percentage type
 */
export function calculateMakingCharges(
  weight: number,
  makingChargeValue: number,
  makingChargeType: 'fixed' | 'percentage' = 'fixed',
  goldValue?: number
): number {
  if (makingChargeType === 'percentage') {
    if (goldValue === undefined) {
      throw new Error('Gold value is required for percentage-based making charges')
    }
    return (goldValue * makingChargeValue) / 100
  }
  // Fixed: per gram charge
  return weight * makingChargeValue
}

/**
 * Calculate GST amount
 */
export function calculateGST(
  goldValue: number,
  makingCharges: number,
  gstRate: number
): number {
  const taxableAmount = goldValue + makingCharges
  return (taxableAmount * gstRate) / 100
}

/**
 * Calculate grand total
 */
export function calculateGrandTotal(
  goldValue: number,
  makingCharges: number,
  gstAmount: number
): number {
  return goldValue + makingCharges + gstAmount
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(sequence: number): string {
  return `INV-${String(sequence).padStart(3, '0')}`
}

