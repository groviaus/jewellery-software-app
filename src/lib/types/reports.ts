export interface DailySalesReport {
  date: string
  total_invoices: number
  total_revenue: number
  total_gst: number
  total_gold_value: number
  total_making_charges: number
}

export interface StockSummary {
  total_items: number
  total_quantity: number
  total_gold_items: number
  total_silver_items: number
  total_diamond_items: number
  low_stock_items: number
  out_of_stock_items: number
}

export interface SoldItem {
  item_id: string
  item_name: string
  sku: string
  quantity_sold: number
  total_revenue: number
  last_sold_date: string
}

export interface ProfitMarginReport {
  total_revenue: number
  total_cost: number
  total_profit: number
  profit_margin: number
  by_metal_type: Array<{
    metal_type: string
    revenue: number
    cost: number
    profit: number
    margin: number
  }>
}

export interface TopSellingItem {
  item_id: string
  item_name: string
  sku: string
  metal_type: string
  quantity_sold: number
  total_revenue: number
  times_sold: number
}

export interface GSTReport {
  monthly_breakdown: Array<{
    month: string
    total_sales: number
    total_gst: number
    taxable_amount: number
    invoice_count: number
  }>
  summary: {
    total_sales: number
    total_gst: number
    total_taxable_amount: number
    total_invoices: number
  }
}

