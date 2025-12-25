'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils/calculations'
import { format } from 'date-fns'
import { Eye, Search, Download } from 'lucide-react'
import { useInvoices } from '@/lib/hooks/useInvoices'
import { Skeleton } from '@/components/ui/skeleton'
import { exportToCSV } from '@/lib/utils/csv-export'
import { toast } from '@/lib/utils/toast'

interface InvoiceListProps {
  invoices: Array<{
    id: string
    invoice_number: string
    total_amount: number
    created_at: string
    customer?: {
      name: string
      phone: string
    } | null
    customer_id: string | null
  }>
}

export default function InvoiceList({ invoices: initialInvoices }: InvoiceListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  
  // Use React Query for cache management
  const { data: invoices = initialInvoices, isLoading } = useInvoices()
  
  // Normalize customer data - Supabase returns customer as array for foreign key relationships
  const normalizedInvoices = useMemo(() => {
    return invoices.map((invoice: any) => ({
      ...invoice,
      customer: Array.isArray(invoice.customer) 
        ? invoice.customer[0] || null
        : invoice.customer || null
    }))
  }, [invoices])

  const filteredInvoices = useMemo(() => {
    if (!searchQuery) return normalizedInvoices
    
    const query = searchQuery.toLowerCase()
    return normalizedInvoices.filter(
      (invoice) =>
        invoice.invoice_number.toLowerCase().includes(query) ||
        invoice.customer?.name?.toLowerCase().includes(query) ||
        invoice.customer?.phone?.includes(query)
    )
  }, [normalizedInvoices, searchQuery])

  if (isLoading && invoices.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) {
      toast.warning('No invoices to export')
      return
    }

    const exportData = filteredInvoices.map((invoice) => ({
      'Invoice Number': invoice.invoice_number,
      Customer: invoice.customer?.name || 'Walk-in Customer',
      Phone: invoice.customer?.phone || '-',
      Date: format(new Date(invoice.created_at), 'MMM dd, yyyy HH:mm'),
      Amount: parseFloat(invoice.total_amount.toString()),
    }))

    exportToCSV(exportData, 'invoices-export')
    toast.success('Invoices exported to CSV')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by invoice number, customer name, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500">
                  {searchQuery ? 'No invoices found matching your search' : 'No invoices yet'}
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>
                    {invoice.customer?.name || 'Walk-in Customer'}
                    {invoice.customer?.phone && (
                      <span className="text-sm text-gray-500 ml-2">
                        ({invoice.customer.phone})
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(invoice.created_at), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(parseFloat(invoice.total_amount.toString()))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/billing/invoice/${invoice.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-gray-500 text-center">
        Showing {filteredInvoices.length} of {normalizedInvoices.length} invoices
      </div>
    </div>
  )
}

