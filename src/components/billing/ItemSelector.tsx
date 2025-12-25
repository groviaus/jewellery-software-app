'use client'

import { useState, useMemo } from 'react'
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
import { Search, Plus } from 'lucide-react'
import type { CartItem } from '@/lib/types/billing'
import { useInventory } from '@/lib/hooks/useInventory'
import type { Item } from '@/lib/types/inventory'
import { Skeleton } from '@/components/ui/skeleton'

interface ItemSelectorProps {
  onAddToCart: (item: CartItem) => void
}

export default function ItemSelector({ onAddToCart }: ItemSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: items = [], isLoading } = useInventory()

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
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search items by name or SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="max-h-96 overflow-y-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Weight (g)</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Metal</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500">
                  {searchQuery ? 'No items found' : 'No items in stock'}
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const isLowStock = item.quantity <= 5
                const isOutOfStock = item.quantity === 0
                
                return (
                  <TableRow key={item.id} className={isOutOfStock ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.sku}</TableCell>
                    <TableCell>{item.net_weight}g</TableCell>
                    <TableCell>
                      <span className={`font-medium ${
                        isOutOfStock 
                          ? 'text-destructive' 
                          : isLowStock 
                            ? 'text-orange-600' 
                            : 'text-green-600'
                      }`}>
                        {item.quantity}
                      </span>
                      {isLowStock && !isOutOfStock && (
                        <span className="ml-1 text-xs text-orange-600">(Low)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.metal_type} {item.purity}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => handleAddItem(item)}
                        disabled={isOutOfStock}
                        variant={isLowStock && !isOutOfStock ? 'outline' : 'default'}
                      >
                        <Plus className="mr-1 h-4 w-4" />
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

