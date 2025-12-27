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
import { useDailySalesReport } from '@/lib/hooks/useReports'
import { useCustomers } from '@/lib/hooks/useCustomers'
import { Skeleton } from '@/components/ui/skeleton'
import { exportToCSV } from '@/lib/utils/csv-export'
import { exportReportToPDF } from '@/lib/utils/pdf-export'
import { exportReportToExcel } from '@/lib/utils/excel-export'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, FileText, FileSpreadsheet } from 'lucide-react'

export default function DailySalesReport() {
  const [startDate, setStartDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  )
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all')
  const [selectedMetalType, setSelectedMetalType] = useState<string>('all')
  
  const { data: customers = [] } = useCustomers()
  const { data: reports = [], isLoading, error, refetch } = useDailySalesReport(
    startDate || undefined,
    endDate || undefined,
    selectedCustomer !== 'all' ? selectedCustomer : undefined,
    selectedMetalType !== 'all' ? selectedMetalType : undefined
  )

  const fetchReports = () => {
    refetch()
  }

  const totalRevenue = reports.reduce((sum, r) => sum + r.total_revenue, 0)
  const totalGST = reports.reduce((sum, r) => sum + r.total_gst, 0)
  const totalInvoices = reports.reduce((sum, r) => sum + r.total_invoices, 0)

  const handleExportCSV = () => {
    if (reports.length === 0) {
      return
    }

    const exportData = reports.map((report) => ({
      Date: format(new Date(report.date), 'MMM dd, yyyy'),
      Invoices: report.total_invoices,
      Revenue: report.total_revenue,
      GST: report.total_gst,
      'Gold Value': report.total_gold_value,
      'Making Charges': report.total_making_charges,
    }))

    exportToCSV(exportData, `daily-sales-${startDate}-to-${endDate}`)
  }

  const handleExportPDF = () => {
    if (reports.length === 0) {
      return
    }

    const exportData = reports.map((report) => ({
      Date: format(new Date(report.date), 'MMM dd, yyyy'),
      Invoices: report.total_invoices,
      Revenue: formatCurrency(report.total_revenue),
      GST: formatCurrency(report.total_gst),
      'Gold Value': formatCurrency(report.total_gold_value),
      'Making Charges': formatCurrency(report.total_making_charges),
    }))

    exportReportToPDF(
      exportData,
      `Daily Sales Report (${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')})`,
      `daily-sales-${startDate}-to-${endDate}`
    )
  }

  const handleExportExcel = () => {
    if (reports.length === 0) {
      return
    }

    const exportData = reports.map((report) => ({
      Date: format(new Date(report.date), 'MMM dd, yyyy'),
      Invoices: report.total_invoices,
      Revenue: report.total_revenue,
      GST: report.total_gst,
      'Gold Value': report.total_gold_value,
      'Making Charges': report.total_making_charges,
    }))

    exportReportToExcel(
      exportData,
      `Daily Sales Report (${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')})`,
      `daily-sales-${startDate}-to-${endDate}`
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Daily Sales Report</CardTitle>
          {reports.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
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
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-5">
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
          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger>
                <SelectValue placeholder="All Customers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="metal_type">Metal Type</Label>
            <Select value={selectedMetalType} onValueChange={setSelectedMetalType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Gold">Gold</SelectItem>
                <SelectItem value="Silver">Silver</SelectItem>
                <SelectItem value="Diamond">Diamond</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={fetchReports} disabled={isLoading} className="w-full">
              {isLoading ? 'Loading...' : 'Generate Report'}
            </Button>
          </div>
        </div>
        
        {/* Date Range Presets */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date()
              setEndDate(format(today, 'yyyy-MM-dd'))
              setStartDate(format(today, 'yyyy-MM-dd'))
              setTimeout(() => fetchReports(), 100)
            }}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date()
              const weekAgo = new Date(today)
              weekAgo.setDate(today.getDate() - 7)
              setEndDate(format(today, 'yyyy-MM-dd'))
              setStartDate(format(weekAgo, 'yyyy-MM-dd'))
              setTimeout(() => fetchReports(), 100)
            }}
          >
            This Week
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date()
              const monthAgo = new Date(today)
              monthAgo.setMonth(today.getMonth() - 1)
              setEndDate(format(today, 'yyyy-MM-dd'))
              setStartDate(format(monthAgo, 'yyyy-MM-dd'))
              setTimeout(() => fetchReports(), 100)
            }}
          >
            This Month
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date()
              const yearStart = new Date(today.getFullYear(), 0, 1)
              setEndDate(format(today, 'yyyy-MM-dd'))
              setStartDate(format(yearStart, 'yyyy-MM-dd'))
              setTimeout(() => fetchReports(), 100)
            }}
          >
            This Year
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        ) : reports.length > 0 ? (
          <>
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Total GST</p>
                <p className="text-2xl font-bold">{formatCurrency(totalGST)}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold">{totalInvoices}</p>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoices</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">GST</TableHead>
                    <TableHead className="text-right">Gold Value</TableHead>
                    <TableHead className="text-right">Making Charges</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.date}>
                      <TableCell>
                        {format(new Date(report.date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{report.total_invoices}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(report.total_revenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(report.total_gst)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(report.total_gold_value)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(report.total_making_charges)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
              Try adjusting the date range or filters
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

