'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils/calculations'
import { format } from 'date-fns'
import { useProfitMarginReport } from '@/lib/hooks/useReports'
import { Skeleton } from '@/components/ui/skeleton'
import { exportReportToPDF } from '@/lib/utils/pdf-export'
import { exportReportToExcel } from '@/lib/utils/excel-export'
import { FileText, FileSpreadsheet } from 'lucide-react'

export default function ProfitMarginReport() {
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd')
  )
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const { data: report, isLoading, error, refetch } = useProfitMarginReport(
    startDate || undefined,
    endDate || undefined
  )

  const fetchReport = () => {
    refetch()
  }

  const handleExportPDF = () => {
    if (!report) return

    const exportData = [
      {
        Metric: 'Total Revenue',
        Value: formatCurrency(report.total_revenue),
      },
      {
        Metric: 'Total Cost',
        Value: formatCurrency(report.total_cost),
      },
      {
        Metric: 'Total Profit',
        Value: formatCurrency(report.total_profit),
      },
      {
        Metric: 'Profit Margin',
        Value: `${report.profit_margin.toFixed(2)}%`,
      },
      ...report.by_metal_type.map((item) => ({
        Metric: `${item.metal_type} - Revenue`,
        Value: formatCurrency(item.revenue),
      })),
      ...report.by_metal_type.map((item) => ({
        Metric: `${item.metal_type} - Profit`,
        Value: formatCurrency(item.profit),
      })),
      ...report.by_metal_type.map((item) => ({
        Metric: `${item.metal_type} - Margin`,
        Value: `${item.margin.toFixed(2)}%`,
      })),
    ]

    exportReportToPDF(
      exportData,
      `Profit Margin Report (${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')})`,
      `profit-margin-${startDate}-to-${endDate}`
    )
  }

  const handleExportExcel = () => {
    if (!report) return

    const exportData = [
      {
        Metric: 'Total Revenue',
        Value: report.total_revenue,
      },
      {
        Metric: 'Total Cost',
        Value: report.total_cost,
      },
      {
        Metric: 'Total Profit',
        Value: report.total_profit,
      },
      {
        Metric: 'Profit Margin (%)',
        Value: report.profit_margin,
      },
      ...report.by_metal_type.flatMap((item) => [
        {
          'Metal Type': item.metal_type,
          Revenue: item.revenue,
          Cost: item.cost,
          Profit: item.profit,
          'Margin (%)': item.margin,
        },
      ]),
    ]

    exportReportToExcel(
      exportData,
      `Profit Margin Report (${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')})`,
      `profit-margin-${startDate}-to-${endDate}`
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Profit Margin Analysis</CardTitle>
          {report && (
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
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_date">End Date</Label>
            <Input
              id="end_date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={fetchReport} disabled={isLoading} className="w-full">
              {isLoading ? 'Loading...' : 'Generate Report'}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        ) : report ? (
          <>
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(report.total_revenue)}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(report.total_cost)}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Total Profit</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(report.total_profit)}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Profit Margin</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {report.profit_margin.toFixed(2)}%
                </p>
              </div>
            </div>

            {report.by_metal_type.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metal Type</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.by_metal_type.map((item) => (
                      <TableRow key={item.metal_type}>
                        <TableCell className="font-medium">{item.metal_type}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.revenue)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.cost)}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(item.profit)}
                        </TableCell>
                        <TableCell className="text-right text-blue-600">
                          {item.margin.toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        ) : error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
            <p className="text-destructive font-medium">Error loading report</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="mt-3"
            >
              Try Again
            </Button>
          </div>
        ) : !isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No data found for the selected period</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting the date range
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

