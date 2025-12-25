import { useQuery } from '@tanstack/react-query'

interface CustomerStats {
  total_purchase_value: number
  purchase_count: number
  last_purchase_date: string | null
}

async function fetchCustomerStats(customerId: string): Promise<CustomerStats> {
  const response = await fetch(`/api/customers/${customerId}/stats`)
  if (!response.ok) {
    throw new Error('Failed to fetch customer stats')
  }
  const data = await response.json()
  return data.data
}

export function useCustomerStats(customerId: string | null) {
  return useQuery({
    queryKey: ['customers', customerId, 'stats'],
    queryFn: () => fetchCustomerStats(customerId!),
    enabled: !!customerId,
  })
}

