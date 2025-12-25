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
import { formatCurrency } from '@/lib/utils/calculations'
import { format } from 'date-fns'
import Link from 'next/link'
import { useRecentInvoices } from '@/lib/hooks/useInvoices'
import { Skeleton } from '@/components/ui/skeleton'

interface RecentSalesProps {
  invoices?: Array<{
    id: string
    invoice_number: string
    total_amount: number
    created_at: string
    customer?: {
      name: string
    } | null
  }>
}

export default function RecentSales({ invoices: initialInvoices }: RecentSalesProps) {
  // Use React Query hook - now the endpoint exists and will fetch/update automatically
  const { data: queryInvoices, isLoading } = useRecentInvoices(10, { 
    initialData: initialInvoices || [] 
  })
  
  // Use query data if available (will auto-update), otherwise use server data
  const displayInvoices = queryInvoices || initialInvoices || []
  
  // Normalize customer data - Supabase returns customer as array for foreign key relationships
  const normalizedInvoices = displayInvoices.map((invoice: any) => ({
    ...invoice,
    customer: Array.isArray(invoice.customer) 
      ? invoice.customer[0] || null
      : invoice.customer || null
  }))
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (!initialInvoices || initialInvoices.length === 0) ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !normalizedInvoices || normalizedInvoices.length === 0 ? (
          <p className="text-center text-gray-500">No recent sales</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {normalizedInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/billing/invoice/${invoice.id}`}
                        className="text-primary hover:underline"
                      >
                        {invoice.invoice_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {invoice.customer?.name || 'Walk-in Customer'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(parseFloat(invoice.total_amount.toString()))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

