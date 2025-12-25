'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/calculations'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

interface PurchaseHistoryProps {
  customerId: string
}

interface Invoice {
  id: string
  invoice_number: string
  total_amount: number
  created_at: string
  items: {
    item_name: string
    quantity: number
    price: number
  }[]
}

export default function PurchaseHistory({ customerId }: PurchaseHistoryProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch(`/api/customers/${customerId}/history`)
        const data = await response.json()
        if (response.ok) {
          setInvoices(data.data || [])
        }
      } catch (error) {
        console.error('Error fetching purchase history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [customerId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>All invoices for this customer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase History</CardTitle>
        <CardDescription>All invoices for this customer</CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <p className="text-center text-gray-500">No purchase history found</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {invoice.items.length} item(s)
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(invoice.total_amount)}
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

