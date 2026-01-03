import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Invoice } from '@/lib/types/billing'

// Query keys
export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters: string) => [...invoiceKeys.lists(), { filters }] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
  recent: () => [...invoiceKeys.lists(), 'recent'] as const,
  today: () => [...invoiceKeys.lists(), 'today'] as const,
  period: (start?: string, end?: string) => [...invoiceKeys.lists(), 'period', { start, end }] as const,
}

// Fetch all invoices
async function fetchInvoices(): Promise<Invoice[]> {
  const response = await fetch('/api/billing/invoice')
  if (!response.ok) {
    throw new Error('Failed to fetch invoices')
  }
  const data = await response.json()
  return data.data || []
}

// Fetch single invoice
async function fetchInvoice(id: string): Promise<Invoice> {
  const response = await fetch(`/api/billing/invoice/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch invoice')
  }
  const data = await response.json()
  return data.data
}

// Fetch invoices for a period
async function fetchInvoicesByPeriod(startDate?: string, endDate?: string): Promise<Invoice[]> {
  let url = '/api/billing/invoice'
  const params = new URLSearchParams()
  if (startDate) {
    if (startDate.length === 10) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      params.append('from', start.toISOString())
    } else {
      params.append('from', startDate)
    }
  }
  if (endDate) {
    // If endDate is just a date (YYYY-MM-DD), make it end of day
    if (endDate.length === 10) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      params.append('to', end.toISOString())
    } else {
      params.append('to', endDate)
    }
  }

  const queryString = params.toString()
  if (queryString) {
    url += `?${queryString}`
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch invoices for period')
  }
  const data = await response.json()
  return data.data || []
}

// Fetch today's invoices
async function fetchTodayInvoices(): Promise<Invoice[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return fetchInvoicesByPeriod(today.toISOString(), tomorrow.toISOString())
}

// Fetch recent invoices
async function fetchRecentInvoices(limit: number = 10): Promise<Invoice[]> {
  const response = await fetch(`/api/billing/invoice?limit=${limit}`)
  if (!response.ok) {
    throw new Error('Failed to fetch recent invoices')
  }
  const data = await response.json()
  return data.data || []
}

// Create invoice
async function createInvoice(invoiceData: {
  customer_id: string | null
  items: any[]
  gold_rate: number
  silver_rate?: number
  diamond_rate?: number
  discount_type?: 'percentage' | 'fixed'
  discount_value?: number
}): Promise<Invoice> {
  const response = await fetch('/api/billing/invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invoiceData),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create invoice')
  }
  const data = await response.json()
  return data.data
}

// Hooks
export function useInvoices() {
  return useQuery({
    queryKey: invoiceKeys.lists(),
    queryFn: fetchInvoices,
  })
}

export function useInvoice(id: string | null) {
  return useQuery({
    queryKey: invoiceKeys.detail(id!),
    queryFn: () => fetchInvoice(id!),
    enabled: !!id,
  })
}

export function useTodayInvoices(options?: { initialData?: Invoice[] }) {
  return useQuery({
    queryKey: invoiceKeys.today(),
    queryFn: fetchTodayInvoices,
    initialData: options?.initialData,
  })
}

export function usePeriodInvoices(startDate?: string, endDate?: string, options?: { initialData?: Invoice[] }) {
  return useQuery({
    queryKey: invoiceKeys.period(startDate, endDate),
    queryFn: () => fetchInvoicesByPeriod(startDate, endDate),
    initialData: options?.initialData,
    enabled: !!startDate || !!endDate,
  })
}

export function useRecentInvoices(limit: number = 10, options?: { initialData?: Invoice[] }) {
  return useQuery({
    queryKey: [...invoiceKeys.recent(), limit],
    queryFn: () => fetchRecentInvoices(limit),
    initialData: options?.initialData,
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      // Invalidate all invoice-related queries
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
      // Invalidate inventory (stock was updated)
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      // Invalidate reports
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

