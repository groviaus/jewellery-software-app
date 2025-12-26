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
import type { Invoice } from '@/lib/types/billing'

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
    initialData: (initialInvoices || []) as Invoice[]
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
    <Card className="h-auto lg:h-[330px] flex flex-col">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-lg sm:text-xl">Recent Sales</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {isLoading && (!initialInvoices || initialInvoices.length === 0) ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !normalizedInvoices || normalizedInvoices.length === 0 ? (
          <p className="text-center text-sm text-gray-500">No recent sales</p>
        ) : (
          <div className="h-full overflow-x-auto overflow-y-auto scrollbar-hide rounded-md border -mx-3 sm:mx-0">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Invoice #</TableHead>
                  <TableHead className="text-xs sm:text-sm">Customer</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {normalizedInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap">
                      <Link
                        href={`/billing/invoice/${invoice.id}`}
                        className="text-primary hover:underline"
                      >
                        {invoice.invoice_number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      <span className="line-clamp-1">
                        {invoice.customer?.name || 'Walk-in Customer'}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm hidden sm:table-cell whitespace-nowrap">
                      {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-right text-xs sm:text-sm whitespace-nowrap">
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

