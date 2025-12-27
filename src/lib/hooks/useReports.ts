import { useQuery } from '@tanstack/react-query'
import type {
  DailySalesReport,
  SoldItem,
  StockSummary,
  ProfitMarginReport,
  TopSellingItem,
  GSTReport,
} from '@/lib/types/reports'

// Query keys
export const reportKeys = {
  all: ['reports'] as const,
  daily: (from?: string, to?: string, customerId?: string, metalType?: string) => 
    [...reportKeys.all, 'daily', { from, to, customerId, metalType }] as const,
  sold: (from?: string, to?: string, customerId?: string, metalType?: string) => 
    [...reportKeys.all, 'sold', { from, to, customerId, metalType }] as const,
  stock: () => [...reportKeys.all, 'stock'] as const,
  profitMargin: (from?: string, to?: string) => 
    [...reportKeys.all, 'profit-margin', { from, to }] as const,
  topSelling: (from?: string, to?: string, limit?: number) => 
    [...reportKeys.all, 'top-selling', { from, to, limit }] as const,
  gst: (from?: string, to?: string) => 
    [...reportKeys.all, 'gst', { from, to }] as const,
}

// Fetch daily sales report
async function fetchDailySalesReport(
  from?: string,
  to?: string,
  customerId?: string,
  metalType?: string
): Promise<DailySalesReport[]> {
  const params = new URLSearchParams()
  if (from) params.append('start_date', from)
  if (to) params.append('end_date', to)
  if (customerId) params.append('customer_id', customerId)
  if (metalType) params.append('metal_type', metalType)

  const response = await fetch(`/api/reports/daily?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch daily sales report')
  }
  const data = await response.json()
  return data.data
}

// Fetch sold items report
async function fetchSoldItemsReport(
  from?: string,
  to?: string,
  customerId?: string,
  metalType?: string
): Promise<SoldItem[]> {
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  if (customerId) params.append('customer_id', customerId)
  if (metalType) params.append('metal_type', metalType)

  const response = await fetch(`/api/reports/sold?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch sold items report')
  }
  const data = await response.json()
  return data.data
}

// Fetch stock summary
async function fetchStockSummary(): Promise<StockSummary> {
  const response = await fetch('/api/reports/stock')
  if (!response.ok) {
    throw new Error('Failed to fetch stock summary')
  }
  const data = await response.json()
  return data.data
}

// Hooks
export function useDailySalesReport(
  from?: string,
  to?: string,
  customerId?: string,
  metalType?: string
) {
  return useQuery({
    queryKey: reportKeys.daily(from, to, customerId, metalType),
    queryFn: () => fetchDailySalesReport(from, to, customerId, metalType),
    enabled: !!(from && to), // Only fetch when both dates are provided
  })
}

export function useSoldItemsReport(
  from?: string,
  to?: string,
  customerId?: string,
  metalType?: string
) {
  return useQuery({
    queryKey: reportKeys.sold(from, to, customerId, metalType),
    queryFn: () => fetchSoldItemsReport(from, to, customerId, metalType),
  })
}

export function useStockSummary() {
  return useQuery({
    queryKey: reportKeys.stock(),
    queryFn: fetchStockSummary,
  })
}

// Fetch profit margin report
async function fetchProfitMarginReport(
  from?: string,
  to?: string
): Promise<ProfitMarginReport> {
  const params = new URLSearchParams()
  if (from) params.append('start_date', from)
  if (to) params.append('end_date', to)

  const response = await fetch(`/api/reports/profit-margin?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch profit margin report')
  }
  const data = await response.json()
  return data.data
}

// Fetch top selling items
async function fetchTopSellingItems(
  from?: string,
  to?: string,
  limit?: number
): Promise<TopSellingItem[]> {
  const params = new URLSearchParams()
  if (from) params.append('start_date', from)
  if (to) params.append('end_date', to)
  if (limit) params.append('limit', limit.toString())

  const response = await fetch(`/api/reports/top-selling?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch top selling items')
  }
  const data = await response.json()
  return data.data
}

// Fetch GST report
async function fetchGSTReport(from?: string, to?: string): Promise<GSTReport> {
  const params = new URLSearchParams()
  if (from) params.append('start_date', from)
  if (to) params.append('end_date', to)

  const response = await fetch(`/api/reports/gst?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch GST report')
  }
  const data = await response.json()
  return data.data
}

// Hooks for advanced reports
export function useProfitMarginReport(from?: string, to?: string) {
  return useQuery({
    queryKey: reportKeys.profitMargin(from, to),
    queryFn: () => fetchProfitMarginReport(from, to),
  })
}

export function useTopSellingItems(from?: string, to?: string, limit?: number) {
  return useQuery({
    queryKey: reportKeys.topSelling(from, to, limit),
    queryFn: () => fetchTopSellingItems(from, to, limit),
  })
}

export function useGSTReport(from?: string, to?: string) {
  return useQuery({
    queryKey: reportKeys.gst(from, to),
    queryFn: () => fetchGSTReport(from, to),
  })
}

