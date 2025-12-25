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
import { Edit, Trash2, Search, AlertTriangle, Download } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Item } from '@/lib/types/inventory'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useInventory, useDeleteInventoryItem } from '@/lib/hooks/useInventory'
import { toast } from '@/lib/utils/toast'
import { Skeleton } from '@/components/ui/skeleton'
import { exportToCSV } from '@/lib/utils/csv-export'

interface InventoryTableProps {
  items: Item[]
}

export default function InventoryTable({ items: initialItems }: InventoryTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [metalTypeFilter, setMetalTypeFilter] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('name')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null)

  // Use React Query hook - will use cached data if available
  const { data: items = initialItems, isLoading } = useInventory()
  const deleteMutation = useDeleteInventoryItem()

  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter((item) => {
      // Search filter
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.metal_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.purity.toLowerCase().includes(searchQuery.toLowerCase())

      // Metal type filter
      const matchesMetalType = metalTypeFilter === 'all' || item.metal_type === metalTypeFilter

      // Stock filter
      let matchesStock = true
      if (stockFilter === 'low') {
        matchesStock = item.quantity <= 5 && item.quantity > 0
      } else if (stockFilter === 'out') {
        matchesStock = item.quantity === 0
      } else if (stockFilter === 'in_stock') {
        matchesStock = item.quantity > 5
      }

      return matchesSearch && matchesMetalType && matchesStock
    })

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'stock':
          return b.quantity - a.quantity
        case 'sku':
          return a.sku.localeCompare(b.sku)
        default:
          return 0
      }
    })

    return filtered
  }, [items, searchQuery, metalTypeFilter, stockFilter, sortBy])

  const lowStockItems = useMemo(
    () => items.filter((item) => item.quantity <= 5 && item.quantity > 0),
    [items]
  )

  const outOfStockItems = useMemo(
    () => items.filter((item) => item.quantity === 0),
    [items]
  )

  const handleDeleteClick = (item: Item) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return

    try {
      await deleteMutation.mutateAsync(itemToDelete.id)
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      toast.success('Item deleted successfully')
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Failed to delete item', 'Please try again.')
    }
  }

  if (isLoading && items.length === 0) {
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
      {/* Stock Alerts */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="mb-4 space-y-2">
          {lowStockItems.length > 0 && (
            <div className="rounded-md border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>
                  <strong>{lowStockItems.length}</strong> item(s) with low stock (≤5 units)
                </span>
              </div>
            </div>
          )}
          {outOfStockItems.length > 0 && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>
                  <strong>{outOfStockItems.length}</strong> item(s) out of stock
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name, SKU, metal type, or purity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const exportData = filteredAndSortedItems.map((item) => ({
                Name: item.name,
                SKU: item.sku,
                'Metal Type': item.metal_type,
                Purity: item.purity,
                'Net Weight (g)': item.net_weight,
                'Gross Weight (g)': item.gross_weight,
                'Making Charge': item.making_charge,
                Quantity: item.quantity,
              }))
              exportToCSV(exportData, 'inventory-export')
              toast.success('Inventory exported to CSV')
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Metal Type</label>
            <Select value={metalTypeFilter} onValueChange={setMetalTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Gold">Gold</SelectItem>
                <SelectItem value="Silver">Silver</SelectItem>
                <SelectItem value="Diamond">Diamond</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Stock Status</label>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low">Low Stock (≤5)</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Sort By</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="sku">SKU</SelectItem>
                <SelectItem value="stock">Stock (High to Low)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Metal Type</TableHead>
              <TableHead>Purity</TableHead>
              <TableHead>Net Weight (g)</TableHead>
              <TableHead>Gross Weight (g)</TableHead>
              <TableHead>Making Charge</TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Quantity
                  {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-gray-500">
                  {searchQuery || metalTypeFilter !== 'all' || stockFilter !== 'all'
                    ? 'No items found matching your filters'
                    : 'No items in inventory'}
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedItems.map((item) => {
                const isLowStock = item.quantity <= 5 && item.quantity > 0
                const isOutOfStock = item.quantity === 0

                return (
                  <TableRow
                    key={item.id}
                    className={isOutOfStock ? 'opacity-60' : isLowStock ? 'bg-orange-50/50' : ''}
                  >
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.sku}</TableCell>
                    <TableCell>{item.metal_type}</TableCell>
                    <TableCell>{item.purity}</TableCell>
                    <TableCell>{item.net_weight}g</TableCell>
                    <TableCell>{item.gross_weight}g</TableCell>
                    <TableCell>₹{item.making_charge}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span
                          className={`font-medium ${
                            isOutOfStock
                              ? 'text-destructive'
                              : isLowStock
                                ? 'text-orange-600'
                                : 'text-green-600'
                          }`}
                        >
                          {item.quantity}
                        </span>
                        {isLowStock && (
                          <AlertTriangle className="h-3 w-3 text-orange-500" />
                        )}
                        {isOutOfStock && (
                          <span className="text-xs text-destructive">(Out)</span>
                        )}
                      </div>
                    </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/inventory/${item.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(item)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{itemToDelete?.name}&quot;? This action
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

