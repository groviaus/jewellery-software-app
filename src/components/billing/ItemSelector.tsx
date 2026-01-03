'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, Plus, Keyboard } from 'lucide-react'
import type { CartItem } from '@/lib/types/billing'
import { useInventory } from '@/lib/hooks/useInventory'
import { useSettings } from '@/lib/hooks/useSettings'
import type { Item } from '@/lib/types/inventory'
import { Skeleton } from '@/components/ui/skeleton'
import { useKeyboardShortcut } from '@/lib/hooks/useKeyboardShortcut'

interface ItemSelectorProps {
  onAddToCart: (item: CartItem) => void
}

export default function ItemSelector({ onAddToCart }: ItemSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItemIndex, setSelectedItemIndex] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { data: items = [], isLoading } = useInventory()
  const { data: settings } = useSettings()
  const stockAlertThreshold = settings?.stock_alert_threshold || 5

  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item.quantity > 0 &&
          (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    [items, searchQuery]
  )

  // Reset selected index when filtered items change
  useEffect(() => {
    setSelectedItemIndex(0)
  }, [filteredItems.length, searchQuery])

  // Ctrl/Cmd + K: Focus search input
  useKeyboardShortcut('k', () => {
    searchInputRef.current?.focus()
  }, { ctrl: true, meta: true })

  // Enter: Add selected item to cart
  useKeyboardShortcut('Enter', () => {
    if (filteredItems.length > 0 && selectedItemIndex < filteredItems.length) {
      const selectedItem = filteredItems[selectedItemIndex]
      if (selectedItem && selectedItem.quantity > 0) {
        handleAddItem(selectedItem)
      }
    }
  }, { preventDefault: false })

  const handleAddItem = (item: Item) => {
    const cartItem: CartItem = {
      item_id: item.id,
      item: {
        id: item.id,
        name: item.name,
        sku: item.sku,
        metal_type: item.metal_type,
        purity: item.purity,
        net_weight: item.net_weight,
        making_charge: item.making_charge,
        making_charge_type: item.making_charge_type || 'percentage',
        quantity: item.quantity,
      },
      quantity: 1,
      weight: item.net_weight,
      gold_value: 0, // Will be calculated
      making_charges: item.making_charge,
      subtotal: 0, // Will be calculated
    }
    onAddToCart(cartItem)
  }

  if (isLoading) {
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
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          placeholder="Search items by name or SKU... (Ctrl+K)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
          <Keyboard className="h-3 w-3" />
          <span>Ctrl+K</span>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto overflow-x-auto rounded-md border scrollbar-hide">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="text-xs uppercase tracking-wider">
              <TableHead className="px-2 h-10">Name</TableHead>
              <TableHead className="px-2 h-10">SKU</TableHead>
              <TableHead className="px-2 h-10">Weight</TableHead>
              <TableHead className="px-2 h-10">Stock</TableHead>
              <TableHead className="px-2 h-10">Metal</TableHead>
              <TableHead className="text-right px-2 h-10">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {searchQuery ? 'No items found' : 'No items in stock'}
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item, index) => {
                const isLowStock = item.quantity <= stockAlertThreshold && item.quantity > 0
                const isOutOfStock = item.quantity === 0
                const isSelected = index === selectedItemIndex

                return (
                  <TableRow
                    key={item.id}
                    className={`text-xs sm:text-sm ${isOutOfStock ? 'opacity-50' : ''} ${isSelected ? 'bg-muted' : ''}`}
                    onMouseEnter={() => setSelectedItemIndex(index)}
                  >
                    <TableCell className="font-medium px-2 py-2 whitespace-nowrap">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground px-2 py-2 whitespace-nowrap">{item.sku}</TableCell>
                    <TableCell className="px-2 py-2 whitespace-nowrap">{item.net_weight}g</TableCell>
                    <TableCell className="px-2 py-2">
                      <span className={`font-medium ${isOutOfStock
                        ? 'text-destructive'
                        : isLowStock
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-green-600 dark:text-green-400'
                        }`}>
                        {item.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground px-2 py-2 whitespace-nowrap">
                      {item.metal_type} {item.purity}
                    </TableCell>
                    <TableCell className="text-right px-2 py-2">
                      <Button
                        size="sm"
                        onClick={() => handleAddItem(item)}
                        disabled={isOutOfStock}
                        className="h-8 px-2"
                        variant={isLowStock && !isOutOfStock ? 'outline' : 'default'}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Add
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

