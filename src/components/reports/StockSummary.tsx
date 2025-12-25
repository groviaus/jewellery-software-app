'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useStockSummary } from '@/lib/hooks/useReports'
import { Skeleton } from '@/components/ui/skeleton'

export default function StockSummary() {
  const { data: summary, isLoading } = useStockSummary()

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
        <Skeleton className="h-32 w-full md:col-span-2" />
      </div>
    )
  }

  if (!summary) {
    return <p className="text-center text-gray-500">No data available</p>
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Total Items</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{summary.total_items}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Total Quantity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{summary.total_quantity}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gold Items</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{summary.total_gold_items}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Low Stock Items</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-destructive">
            {summary.low_stock_items}
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Items by Metal Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Gold:</span>
              <span className="font-semibold">{summary.total_gold_items}</span>
            </div>
            <div className="flex justify-between">
              <span>Silver:</span>
              <span className="font-semibold">{summary.total_silver_items}</span>
            </div>
            <div className="flex justify-between">
              <span>Diamond:</span>
              <span className="font-semibold">{summary.total_diamond_items}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

