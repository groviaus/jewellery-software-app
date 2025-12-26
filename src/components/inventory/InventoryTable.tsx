'use client'

import { useState, useMemo, useEffect } from 'react'
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
import { Edit, Trash2, Search, AlertTriangle, Download, CheckSquare, Eye, EyeOff, Columns } from 'lucide-react'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import BulkActions from './BulkActions'
import AdvancedFilters, { type FilterPreset } from './AdvancedFilters'
import { useUpdateInventoryItem } from '@/lib/hooks/useInventory'
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
import { useSettings } from '@/lib/hooks/useSettings'
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
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(['name', 'sku', 'metal_type', 'purity', 'net_weight', 'gross_weight', 'making_charge', 'quantity', 'actions'])
  )
  const [advancedFilters, setAdvancedFilters] = useState<FilterPreset['filters']>({})

  // Use React Query hook - will use cached data if available
  const { data: items = initialItems, isLoading } = useInventory()
  const deleteMutation = useDeleteInventoryItem()
  const updateMutation = useUpdateInventoryItem()
  const { data: settings } = useSettings()
  const stockAlertThreshold = settings?.stock_alert_threshold || 5

  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter((item) => {
      // Basic search filter (can be overridden by advanced filters)
      const basicSearchQuery = advancedFilters.searchQuery !== undefined
        ? advancedFilters.searchQuery
        : searchQuery
      const matchesSearch = !basicSearchQuery ||
        item.name.toLowerCase().includes(basicSearchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(basicSearchQuery.toLowerCase()) ||
        item.metal_type.toLowerCase().includes(basicSearchQuery.toLowerCase()) ||
        item.purity.toLowerCase().includes(basicSearchQuery.toLowerCase())

      // Metal type filter (advanced filters take precedence)
      const filterMetalType = advancedFilters.metalType !== undefined
        ? advancedFilters.metalType
        : metalTypeFilter
      const matchesMetalType = filterMetalType === 'all' || item.metal_type === filterMetalType

      // Purity filter (from advanced filters)
      const matchesPurity = !advancedFilters.purity ||
        item.purity.toLowerCase().includes(advancedFilters.purity.toLowerCase())

      // Weight filters (from advanced filters)
      const matchesMinWeight = advancedFilters.minWeight === undefined ||
        item.net_weight >= advancedFilters.minWeight
      const matchesMaxWeight = advancedFilters.maxWeight === undefined ||
        item.net_weight <= advancedFilters.maxWeight

      // Quantity filters (from advanced filters)
      const matchesMinQuantity = advancedFilters.minQuantity === undefined ||
        item.quantity >= advancedFilters.minQuantity
      const matchesMaxQuantity = advancedFilters.maxQuantity === undefined ||
        item.quantity <= advancedFilters.maxQuantity

      // Stock filter (advanced filters take precedence)
      const filterStockStatus = advancedFilters.stockStatus !== undefined
        ? advancedFilters.stockStatus
        : stockFilter
      let matchesStock = true
      if (filterStockStatus === 'low') {
        matchesStock = item.quantity <= stockAlertThreshold && item.quantity > 0
      } else if (filterStockStatus === 'out') {
        matchesStock = item.quantity === 0
      } else if (filterStockStatus === 'in_stock') {
        matchesStock = item.quantity > stockAlertThreshold
      }

      return matchesSearch && matchesMetalType && matchesPurity &&
        matchesMinWeight && matchesMaxWeight &&
        matchesMinQuantity && matchesMaxQuantity &&
        matchesStock
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
  }, [items, searchQuery, metalTypeFilter, stockFilter, sortBy, advancedFilters, stockAlertThreshold])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedItems = filteredAndSortedItems.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, metalTypeFilter, stockFilter, advancedFilters])

  const handleApplyAdvancedFilters = (filters: FilterPreset['filters']) => {
    setAdvancedFilters(filters)
    // Update basic filters if they're set in advanced filters
    if (filters.searchQuery !== undefined) {
      setSearchQuery(filters.searchQuery)
    }
    if (filters.metalType !== undefined) {
      setMetalTypeFilter(filters.metalType)
    }
    if (filters.stockStatus !== undefined) {
      setStockFilter(filters.stockStatus)
    }
  }

  const handleClearAdvancedFilters = () => {
    setAdvancedFilters({})
    setSearchQuery('')
    setMetalTypeFilter('all')
    setStockFilter('all')
  }

  const handleInlineEdit = (itemId: string, field: string, currentValue: any) => {
    setEditingItemId(itemId)
    setEditingField(field)
    setEditingValue(String(currentValue))
  }

  const handleInlineSave = async (itemId: string, field: string) => {
    try {
      const updates: Partial<Item> = {}
      if (field === 'making_charge') {
        updates.making_charge = parseFloat(editingValue) || 0
      } else if (field === 'quantity') {
        updates.quantity = parseInt(editingValue) || 0
      } else if (field === 'net_weight') {
        updates.net_weight = parseFloat(editingValue) || 0
      } else if (field === 'gross_weight') {
        updates.gross_weight = parseFloat(editingValue) || 0
      }

      await updateMutation.mutateAsync({ id: itemId, data: updates })
      setEditingItemId(null)
      setEditingField(null)
      setEditingValue('')
      toast.success('Item updated successfully')
    } catch (error) {
      console.error('Error updating item:', error)
      toast.error('Failed to update item', 'Please try again.')
    }
  }

  const toggleColumnVisibility = (column: string) => {
    const newVisible = new Set(visibleColumns)
    if (newVisible.has(column)) {
      newVisible.delete(column)
    } else {
      newVisible.add(column)
    }
    setVisibleColumns(newVisible)
  }

  const lowStockItems = useMemo(
    () => items.filter((item) => item.quantity <= stockAlertThreshold && item.quantity > 0),
    [items, stockAlertThreshold]
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

  const handleBulkDelete = async (itemIds: string[]) => {
    try {
      await Promise.all(itemIds.map((id) => deleteMutation.mutateAsync(id)))
      toast.success(`${itemIds.length} item(s) deleted successfully`)
    } catch (error) {
      console.error('Error deleting items:', error)
      toast.error('Failed to delete some items', 'Please try again.')
    }
  }

  const handleBulkEdit = async (itemIds: string[], updates: Partial<Item>) => {
    try {
      await Promise.all(
        itemIds.map((id) => updateMutation.mutateAsync({ id, data: updates }))
      )
      toast.success(`${itemIds.length} item(s) updated successfully`)
    } catch (error) {
      console.error('Error updating items:', error)
      toast.error('Failed to update some items', 'Please try again.')
    }
  }

  const handleBulkStockUpdate = async (itemIds: string[], quantity: number) => {
    try {
      await Promise.all(
        itemIds.map((id) =>
          updateMutation.mutateAsync({ id, data: { quantity } })
        )
      )
      toast.success(`Stock updated for ${itemIds.length} item(s)`)
    } catch (error) {
      console.error('Error updating stock:', error)
      toast.error('Failed to update stock', 'Please try again.')
    }
  }

  const handleExportSelected = (selectedItemsList: Item[]) => {
    const exportData = selectedItemsList.map((item) => ({
      Name: item.name,
      SKU: item.sku,
      'Metal Type': item.metal_type,
      Purity: item.purity,
      'Net Weight (g)': item.net_weight,
      'Gross Weight (g)': item.gross_weight,
      'Making Charge': item.making_charge,
      Quantity: item.quantity,
    }))
    exportToCSV(exportData, 'inventory-selected-export')
    toast.success('Selected items exported to CSV')
  }

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredAndSortedItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredAndSortedItems.map((item) => item.id)))
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
            <div className="rounded-md border border-orange-500/30 bg-orange-500/20 dark:bg-orange-500/10 p-3 text-sm text-orange-700 dark:text-orange-400">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>
                  <strong>{lowStockItems.length}</strong> item(s) with low stock (≤{stockAlertThreshold} units)
                </span>
              </div>
            </div>
          )}
          {outOfStockItems.length > 0 && (
            <div className="rounded-md border border-red-500/30 bg-red-500/20 dark:bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">
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

      {/* Bulk Actions */}
      <BulkActions
        selectedItems={selectedItems}
        items={items}
        onBulkDelete={handleBulkDelete}
        onBulkEdit={handleBulkEdit}
        onBulkStockUpdate={handleBulkStockUpdate}
        onExportSelected={handleExportSelected}
        onClearSelection={() => setSelectedItems(new Set())}
      />

      {/* Filters */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, SKU, metal type, or purity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AdvancedFilters
              onApplyFilters={handleApplyAdvancedFilters}
              onClearFilters={handleClearAdvancedFilters}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                  <Columns className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Columns</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.has('name')}
                  onCheckedChange={() => toggleColumnVisibility('name')}
                >
                  Name
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.has('sku')}
                  onCheckedChange={() => toggleColumnVisibility('sku')}
                >
                  SKU
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.has('metal_type')}
                  onCheckedChange={() => toggleColumnVisibility('metal_type')}
                >
                  Metal Type
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.has('purity')}
                  onCheckedChange={() => toggleColumnVisibility('purity')}
                >
                  Purity
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.has('net_weight')}
                  onCheckedChange={() => toggleColumnVisibility('net_weight')}
                >
                  Net Weight
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.has('gross_weight')}
                  onCheckedChange={() => toggleColumnVisibility('gross_weight')}
                >
                  Gross Weight
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.has('making_charge')}
                  onCheckedChange={() => toggleColumnVisibility('making_charge')}
                >
                  Making Charge
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={visibleColumns.has('quantity')}
                  onCheckedChange={() => toggleColumnVisibility('quantity')}
                >
                  Quantity
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
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
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={stockFilter === 'low' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStockFilter('low')}
          >
            Low Stock
          </Button>
          <Button
            variant={stockFilter === 'out' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStockFilter('out')}
          >
            Out of Stock
          </Button>
          <Button
            variant={metalTypeFilter === 'Gold' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMetalTypeFilter('Gold')}
          >
            Gold Items
          </Button>
          <Button
            variant={metalTypeFilter === 'Silver' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMetalTypeFilter('Silver')}
          >
            Silver Items
          </Button>
          {(Object.keys(advancedFilters).length > 0 || searchQuery || metalTypeFilter !== 'all' || stockFilter !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAdvancedFilters}
            >
              Clear Filters
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium">Metal Type</label>
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
            <label className="text-xs sm:text-sm font-medium">Stock Status</label>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low">Low Stock (≤{stockAlertThreshold})</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium">Sort By</label>
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

      <div className="rounded-md border overflow-x-auto -mx-3 sm:mx-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center justify-center"
                  title="Select all"
                >
                  <CheckSquare
                    className={`h-4 w-4 ${selectedItems.size === filteredAndSortedItems.length &&
                      filteredAndSortedItems.length > 0
                      ? 'text-primary'
                      : 'text-muted-foreground'
                      }`}
                  />
                </button>
              </TableHead>
              {visibleColumns.has('name') && <TableHead>Name</TableHead>}
              {visibleColumns.has('sku') && <TableHead>SKU</TableHead>}
              {visibleColumns.has('metal_type') && <TableHead>Metal Type</TableHead>}
              {visibleColumns.has('purity') && <TableHead>Purity</TableHead>}
              {visibleColumns.has('net_weight') && <TableHead>Net Weight (g)</TableHead>}
              {visibleColumns.has('gross_weight') && <TableHead>Gross Weight (g)</TableHead>}
              {visibleColumns.has('making_charge') && <TableHead>Making Charge</TableHead>}
              {visibleColumns.has('quantity') && (
                <TableHead>
                  <div className="flex items-center gap-1">
                    Quantity
                    {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
                      <AlertTriangle className="h-3 w-3 text-orange-500 dark:text-orange-400" />
                    )}
                  </div>
                </TableHead>
              )}
              {visibleColumns.has('actions') && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.size + 1} className="text-center text-muted-foreground">
                  {searchQuery || metalTypeFilter !== 'all' || stockFilter !== 'all'
                    ? 'No items found matching your filters'
                    : 'No items in inventory'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((item) => {
                const isLowStock = item.quantity <= stockAlertThreshold && item.quantity > 0
                const isOutOfStock = item.quantity === 0
                const isSelected = selectedItems.has(item.id)

                return (
                  <TableRow
                    key={item.id}
                    className={`${isOutOfStock ? 'opacity-60' : isLowStock ? 'bg-orange-50/50' : ''} ${isSelected ? 'bg-muted' : ''}`}
                  >
                    <TableCell>
                      <button
                        onClick={() => toggleItemSelection(item.id)}
                        className="flex items-center justify-center"
                        title="Select item"
                      >
                        <CheckSquare
                          className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'
                            }`}
                        />
                      </button>
                    </TableCell>
                    {visibleColumns.has('name') && (
                      <TableCell className="font-medium">{item.name}</TableCell>
                    )}
                    {visibleColumns.has('sku') && (
                      <TableCell className="text-sm text-muted-foreground">{item.sku}</TableCell>
                    )}
                    {visibleColumns.has('metal_type') && (
                      <TableCell>{item.metal_type}</TableCell>
                    )}
                    {visibleColumns.has('purity') && (
                      <TableCell>{item.purity}</TableCell>
                    )}
                    {visibleColumns.has('net_weight') && (
                      <TableCell
                        onDoubleClick={() => handleInlineEdit(item.id, 'net_weight', item.net_weight)}
                        className="cursor-pointer"
                      >
                        {editingItemId === item.id && editingField === 'net_weight' ? (
                          <Input
                            type="number"
                            step="0.001"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => handleInlineSave(item.id, 'net_weight')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleInlineSave(item.id, 'net_weight')
                              } else if (e.key === 'Escape') {
                                setEditingItemId(null)
                                setEditingField(null)
                              }
                            }}
                            autoFocus
                            className="w-20"
                          />
                        ) : (
                          `${item.net_weight}g`
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.has('gross_weight') && (
                      <TableCell
                        onDoubleClick={() => handleInlineEdit(item.id, 'gross_weight', item.gross_weight)}
                        className="cursor-pointer"
                      >
                        {editingItemId === item.id && editingField === 'gross_weight' ? (
                          <Input
                            type="number"
                            step="0.001"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => handleInlineSave(item.id, 'gross_weight')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleInlineSave(item.id, 'gross_weight')
                              } else if (e.key === 'Escape') {
                                setEditingItemId(null)
                                setEditingField(null)
                              }
                            }}
                            autoFocus
                            className="w-20"
                          />
                        ) : (
                          `${item.gross_weight}g`
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.has('making_charge') && (
                      <TableCell
                        onDoubleClick={() => handleInlineEdit(item.id, 'making_charge', item.making_charge)}
                        className="cursor-pointer"
                      >
                        {editingItemId === item.id && editingField === 'making_charge' ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => handleInlineSave(item.id, 'making_charge')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleInlineSave(item.id, 'making_charge')
                              } else if (e.key === 'Escape') {
                                setEditingItemId(null)
                                setEditingField(null)
                              }
                            }}
                            autoFocus
                            className="w-24"
                          />
                        ) : (
                          `₹${item.making_charge}`
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.has('quantity') && (
                      <TableCell
                        onDoubleClick={() => handleInlineEdit(item.id, 'quantity', item.quantity)}
                        className="cursor-pointer"
                      >
                        {editingItemId === item.id && editingField === 'quantity' ? (
                          <Input
                            type="number"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={() => handleInlineSave(item.id, 'quantity')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleInlineSave(item.id, 'quantity')
                              } else if (e.key === 'Escape') {
                                setEditingItemId(null)
                                setEditingField(null)
                              }
                            }}
                            autoFocus
                            className="w-20"
                          />
                        ) : (
                          <div className="flex items-center gap-1">
                            <span
                              className={`font-medium ${isOutOfStock
                                ? 'text-destructive'
                                : isLowStock
                                  ? 'text-orange-600 dark:text-orange-400'
                                  : 'text-green-600 dark:text-green-400'
                                }`}
                            >
                              {item.quantity}
                            </span>
                            {isLowStock && (
                              <AlertTriangle className="h-3 w-3 text-orange-500 dark:text-orange-400" />
                            )}
                            {isOutOfStock && (
                              <span className="text-xs text-destructive">(Out)</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.has('actions') && (
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
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredAndSortedItems.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedItems.length)} of {filteredAndSortedItems.length} items
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Items per page:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(parseInt(value))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="25">25 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {totalPages > 1 && (
              <div className="flex-shrink-0">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>
      )}

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

