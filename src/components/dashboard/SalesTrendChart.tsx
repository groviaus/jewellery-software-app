'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import SalesChart from '@/components/charts/SalesChart'
import { useRecentInvoices, usePeriodInvoices } from '@/lib/hooks/useInvoices'
import { Skeleton } from '@/components/ui/skeleton'
import type { Invoice } from '@/lib/types/billing'

interface SalesTrendChartProps {
  initialInvoices?: Array<{
    id: string
    total_amount: number
    created_at: string
  }>
  startDate?: string
  endDate?: string
}

export default function SalesTrendChart({ initialInvoices, startDate, endDate }: SalesTrendChartProps) {
  const hasDateRange = !!(startDate || endDate)

  const { data: periodInvoices, isLoading: isPeriodLoading } = usePeriodInvoices(startDate, endDate)
  const { data: recentInvoices, isLoading: isRecentLoading } = useRecentInvoices(30, {
    initialData: (initialInvoices || []) as Invoice[],
  })

  // Use period invoices if range is provided, fallback to last 30 days
  const invoices = hasDateRange ? (periodInvoices || []) : (recentInvoices || initialInvoices || [])
  const isLoading = hasDateRange ? isPeriodLoading : isRecentLoading

  const title = useMemo(() => {
    if (!hasDateRange) return "Sales Trend (Last 30 Days)"
    if (startDate && endDate) return `Sales Trend (${startDate} to ${endDate})`
    if (startDate) return `Sales Trend (since ${startDate})`
    return "Sales Trend"
  }, [startDate, endDate, hasDateRange])

  const chartData = useMemo(() => {
    // Group invoices by date
    const grouped = invoices.reduce((acc, invoice) => {
      const date = new Date(invoice.created_at).toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { date, revenue: 0, invoices: 0 }
      }
      acc[date].revenue += parseFloat(invoice.total_amount.toString())
      acc[date].invoices += 1
      return acc
    }, {} as Record<string, { date: string; revenue: number; invoices: number }>)

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date))
  }, [invoices])

  if (isLoading && (!initialInvoices || initialInvoices.length === 0)) {
    return (
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-base sm:text-lg md:text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] sm:h-[300px] md:h-[350px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-base sm:text-lg md:text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0 sm:px-3 md:px-6">
        {chartData.length > 0 ? (
          <SalesChart data={chartData} period="daily" />
        ) : (
          <p className="text-center text-gray-500 py-12 sm:py-20 text-sm sm:text-base">No sales data available</p>
        )}
      </CardContent>
    </Card>
  )
}

