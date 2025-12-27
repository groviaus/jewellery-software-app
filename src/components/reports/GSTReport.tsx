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
import { useGSTReport } from '@/lib/hooks/useReports'
import { Skeleton } from '@/components/ui/skeleton'
import { exportReportToPDF } from '@/lib/utils/pdf-export'
import { exportReportToExcel } from '@/lib/utils/excel-export'
import { FileText, FileSpreadsheet } from 'lucide-react'

export default function GSTReport() {
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd')
  )
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  
  const { data: report, isLoading, error, refetch } = useGSTReport(
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
        Metric: 'Total Sales',
        Value: formatCurrency(report.summary.total_sales),
      },
      {
        Metric: 'Total GST',
        Value: formatCurrency(report.summary.total_gst),
      },
      {
        Metric: 'Total Taxable Amount',
        Value: formatCurrency(report.summary.total_taxable_amount),
      },
      {
        Metric: 'Total Invoices',
        Value: report.summary.total_invoices,
      },
      ...report.monthly_breakdown.map((month) => ({
        Month: format(new Date(month.month + '-01'), 'MMM yyyy'),
        'Total Sales': formatCurrency(month.total_sales),
        'Total GST': formatCurrency(month.total_gst),
        'Taxable Amount': formatCurrency(month.taxable_amount),
        'Invoice Count': month.invoice_count,
      })),
    ]

    exportReportToPDF(
      exportData,
      `GST Report (${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')})`,
      `gst-report-${startDate}-to-${endDate}`
    )
  }

  const handleExportExcel = () => {
    if (!report) return

    const exportData = [
      {
        Metric: 'Total Sales',
        Value: report.summary.total_sales,
      },
      {
        Metric: 'Total GST',
        Value: report.summary.total_gst,
      },
      {
        Metric: 'Total Taxable Amount',
        Value: report.summary.total_taxable_amount,
      },
      {
        Metric: 'Total Invoices',
        Value: report.summary.total_invoices,
      },
      ...report.monthly_breakdown.map((month) => ({
        Month: format(new Date(month.month + '-01'), 'MMM yyyy'),
        'Total Sales': month.total_sales,
        'Total GST': month.total_gst,
        'Taxable Amount': month.taxable_amount,
        'Invoice Count': month.invoice_count,
      })),
    ]

    exportReportToExcel(
      exportData,
      `GST Report (${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')})`,
      `gst-report-${startDate}-to-${endDate}`
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>GST Report</CardTitle>
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
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold">{formatCurrency(report.summary.total_sales)}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Total GST</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(report.summary.total_gst)}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Taxable Amount</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(report.summary.total_taxable_amount)}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold">{report.summary.total_invoices}</p>
              </div>
            </div>

            {report.monthly_breakdown.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Total Sales</TableHead>
                      <TableHead className="text-right">Taxable Amount</TableHead>
                      <TableHead className="text-right">GST</TableHead>
                      <TableHead className="text-right">Invoices</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.monthly_breakdown.map((month) => (
                      <TableRow key={month.month}>
                        <TableCell className="font-medium">
                          {format(new Date(month.month + '-01'), 'MMM yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(month.total_sales)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(month.taxable_amount)}
                        </TableCell>
                        <TableCell className="text-right text-red-600 dark:text-red-400">
                          {formatCurrency(month.total_gst)}
                        </TableCell>
                        <TableCell className="text-right">{month.invoice_count}</TableCell>
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

