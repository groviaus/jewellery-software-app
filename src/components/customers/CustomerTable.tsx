'use client'

import { useState, useMemo } from 'react'
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
import { Search, Download } from 'lucide-react'
import type { Customer } from '@/lib/types/customer'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCustomers, useDeleteCustomer } from '@/lib/hooks/useCustomers'
import { toast } from '@/lib/utils/toast'
import { Skeleton } from '@/components/ui/skeleton'
import CustomerRow from './CustomerRow'
import { exportToCSV } from '@/lib/utils/csv-export'

interface CustomerTableProps {
  customers: Customer[]
}

export default function CustomerTable({ customers: initialCustomers }: CustomerTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)

  // Use React Query hook - will use cached data if available
  const { data: customers = initialCustomers, isLoading } = useCustomers()
  const deleteMutation = useDeleteCustomer()

  const filteredCustomers = useMemo(
    () =>
      customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.phone.includes(searchQuery)
      ),
    [customers, searchQuery]
  )

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return

    try {
      await deleteMutation.mutateAsync(customerToDelete.id)
      setDeleteDialogOpen(false)
      setCustomerToDelete(null)
      toast.success('Customer deleted successfully')
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast.error('Failed to delete customer', 'Please try again.')
    }
  }

  if (isLoading && customers.length === 0) {
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

  return (
    <>
      <div className="mb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => {
              const exportData = filteredCustomers.map((customer) => ({
                Name: customer.name,
                Phone: customer.phone,
                'Created Date': new Date(customer.created_at).toLocaleDateString(),
              }))
              exportToCSV(exportData, 'customers-export')
              toast.success('Customers exported to CSV')
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto -mx-3 sm:mx-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs sm:text-sm">Name</TableHead>
              <TableHead className="text-xs sm:text-sm">Phone</TableHead>
              <TableHead className="text-xs sm:text-sm hidden md:table-cell">Total Purchases</TableHead>
              <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Last Purchase</TableHead>
              <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-gray-500">
                  {searchQuery ? 'No customers found matching your search' : 'No customers yet'}
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  onDelete={handleDeleteClick}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{customerToDelete?.name}&quot;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

