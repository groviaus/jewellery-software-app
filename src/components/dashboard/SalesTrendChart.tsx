'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import SalesChart from '@/components/charts/SalesChart'
import { useRecentInvoices } from '@/lib/hooks/useInvoices'
import { Skeleton } from '@/components/ui/skeleton'

interface SalesTrendChartProps {
  initialInvoices?: Array<{
    id: string
    total_amount: number
    created_at: string
  }>
}

export default function SalesTrendChart({ initialInvoices }: SalesTrendChartProps) {
  const { data: invoices = initialInvoices || [], isLoading } = useRecentInvoices(30, {
    initialData: initialInvoices || [],
  })

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
        <CardHeader>
          <CardTitle>Sales Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Trend (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <SalesChart data={chartData} period="daily" />
        ) : (
          <p className="text-center text-gray-500 py-20">No sales data available</p>
        )}
      </CardContent>
    </Card>
  )
}

