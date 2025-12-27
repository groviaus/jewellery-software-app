'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useStockSummary } from '@/lib/hooks/useReports'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { exportReportToPDF } from '@/lib/utils/pdf-export'
import { exportReportToExcel } from '@/lib/utils/excel-export'
import {
  FileText,
  FileSpreadsheet,
  Package,
  Boxes,
  Gem,
  Coins,
  Sparkles,
  AlertTriangle,
  BarChart3,
} from 'lucide-react'
import Link from 'next/link'

export default function StockSummary() {
  const { data: summary, isLoading, error, refetch } = useStockSummary()

  const handleExportPDF = () => {
    if (!summary) return

    const exportData = [
      {
        Metric: 'Total Items',
        Value: summary.total_items,
      },
      {
        Metric: 'Total Quantity',
        Value: summary.total_quantity,
      },
      {
        Metric: 'Gold Items',
        Value: summary.total_gold_items,
      },
      {
        Metric: 'Silver Items',
        Value: summary.total_silver_items,
      },
      {
        Metric: 'Diamond Items',
        Value: summary.total_diamond_items,
      },
      {
        Metric: 'Low Stock Items',
        Value: summary.low_stock_items,
      },
      {
        Metric: 'Out of Stock Items',
        Value: summary.out_of_stock_items,
      },
    ]

    exportReportToPDF(exportData, 'Stock Summary Report', 'stock-summary')
  }

  const handleExportExcel = () => {
    if (!summary) return

    const exportData = [
      {
        Metric: 'Total Items',
        Value: summary.total_items,
      },
      {
        Metric: 'Total Quantity',
        Value: summary.total_quantity,
      },
      {
        Metric: 'Gold Items',
        Value: summary.total_gold_items,
      },
      {
        Metric: 'Silver Items',
        Value: summary.total_silver_items,
      },
      {
        Metric: 'Diamond Items',
        Value: summary.total_diamond_items,
      },
      {
        Metric: 'Low Stock Items',
        Value: summary.low_stock_items,
      },
      {
        Metric: 'Out of Stock Items',
        Value: summary.out_of_stock_items,
      },
    ]

    exportReportToExcel(exportData, 'Stock Summary Report', 'stock-summary')
  }

  // Calculate percentages for metal type distribution
  const totalMetalItems =
    summary?.total_gold_items + summary?.total_silver_items + summary?.total_diamond_items || 0
  const goldPercentage =
    totalMetalItems > 0 ? Math.round((summary?.total_gold_items / totalMetalItems) * 100) : 0
  const silverPercentage =
    totalMetalItems > 0 ? Math.round((summary?.total_silver_items / totalMetalItems) * 100) : 0
  const diamondPercentage =
    totalMetalItems > 0 ? Math.round((summary?.total_diamond_items / totalMetalItems) * 100) : 0

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Stock Summary</CardTitle>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="mt-6 h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
            <p className="text-destructive font-medium">Error loading stock summary</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No stock data available</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Add items to your inventory to see the summary
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Stock Summary</CardTitle>
          {summary && (
            <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExportPDF}>
          <FileText className="mr-2 h-4 w-4" />
          PDF
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportExcel}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Excel
        </Button>
      </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Items Card */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold">{summary.total_items}</div>
              <p className="text-xs text-muted-foreground">Unique items in inventory</p>
          </CardContent>
        </Card>

          {/* Total Quantity Card */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
              <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold">{summary.total_quantity}</div>
              <p className="text-xs text-muted-foreground">Total units available</p>
          </CardContent>
        </Card>

          {/* Gold Items Card */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gold Items</CardTitle>
              <Gem className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {summary.total_gold_items}
              </div>
              <p className="text-xs text-muted-foreground">Gold jewelry items</p>
          </CardContent>
        </Card>

          {/* Silver Items Card */}
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Silver Items</CardTitle>
              <Coins className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                {summary.total_silver_items}
              </div>
              <p className="text-xs text-muted-foreground">Silver jewelry items</p>
          </CardContent>
        </Card>

          {/* Diamond Items Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diamond Items</CardTitle>
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {summary.total_diamond_items}
              </div>
              <p className="text-xs text-muted-foreground">Diamond jewelry items</p>
            </CardContent>
          </Card>

          {/* Low Stock Items Card */}
          <Card
            className={
              summary.low_stock_items > 0
                ? 'border-orange-500/30 bg-orange-500/10 dark:bg-orange-500/20'
                : ''
            }
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {summary.low_stock_items}
              </div>
              <p className="text-xs text-muted-foreground">Items need restocking</p>
              {summary.low_stock_items > 0 && (
                <Link href="/inventory" className="mt-2 block">
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                    View Items →
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Out of Stock Items Card */}
          {summary.out_of_stock_items > 0 && (
            <Card className="border-red-500/30 bg-red-500/10 dark:bg-red-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
                  Out of Stock
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {summary.out_of_stock_items}
                </div>
                <p className="text-xs text-red-700 dark:text-red-400">
                  Items need immediate attention
                </p>
                <Link href="/inventory" className="mt-2 block">
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs text-red-700 dark:text-red-400"
                  >
                    View Items →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Enhanced Metal Type Distribution */}
        {totalMetalItems > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Items by Metal Type</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Gold */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gem className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="font-medium">Gold</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {goldPercentage}%
                      </span>
                      <span className="font-semibold">{summary.total_gold_items} items</span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-yellow-600 dark:bg-yellow-400 transition-all"
                      style={{ width: `${goldPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Silver */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="font-medium">Silver</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {silverPercentage}%
                      </span>
                      <span className="font-semibold">{summary.total_silver_items} items</span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-gray-600 dark:bg-gray-400 transition-all"
                      style={{ width: `${silverPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Diamond */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium">Diamond</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {diamondPercentage}%
                      </span>
                      <span className="font-semibold">{summary.total_diamond_items} items</span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-blue-600 dark:bg-blue-400 transition-all"
                      style={{ width: `${diamondPercentage}%` }}
                    />
                  </div>
              </div>
            </div>
          </CardContent>
        </Card>
        )}
      </CardContent>
    </Card>
  )
}
