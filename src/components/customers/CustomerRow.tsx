'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { Edit, Trash2, History } from 'lucide-react'
import type { Customer } from '@/lib/types/customer'
import { useCustomerStats } from '@/lib/hooks/useCustomerStats'
import { formatCurrency } from '@/lib/utils/calculations'
import { format } from 'date-fns'

interface CustomerRowProps {
  customer: Customer
  onDelete: (customer: Customer) => void
}

export default function CustomerRow({ customer, onDelete }: CustomerRowProps) {
  const { data: stats } = useCustomerStats(customer.id)

  return (
    <TableRow>
      <TableCell className="font-medium">{customer.name}</TableCell>
      <TableCell>{customer.phone}</TableCell>
      <TableCell>
        {stats ? (
          <div className="space-y-0.5">
            <div className="font-medium text-green-600">
              {formatCurrency(stats.total_purchase_value)}
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.purchase_count} purchase{stats.purchase_count !== 1 ? 's' : ''}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>
      <TableCell>
        {stats?.last_purchase_date ? (
          <span className="text-sm">
            {format(new Date(stats.last_purchase_date), 'MMM dd, yyyy')}
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">Never</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Link href={`/customers/${customer.id}/history`}>
            <Button variant="ghost" size="sm">
              <History className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/customers/${customer.id}/edit`}>
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(customer)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

