'use client'

import { useMemo, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { X, Copy, GripVertical, Printer, Save, PieChart, Tag, Percent } from 'lucide-react'
import RevenueChart from '@/components/charts/RevenueChart'
import { toast } from '@/lib/utils/toast'
import type { CartItem } from '@/lib/types/billing'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  calculateGoldValue,
  calculateMakingCharges,
  calculateGST,
  calculateGrandTotal,
  formatCurrency,
} from '@/lib/utils/calculations'

interface InvoicePreviewProps {
  cart: CartItem[]
  goldRate: number
  silverRate?: number
  diamondRate?: number
  gstRate: number
  onRemoveItem: (itemId: string) => void
  onUpdateItem: (itemId: string, updates: Partial<CartItem>) => void
  onReorderItems?: (items: CartItem[]) => void
  onDuplicateItem?: (item: CartItem) => void
  discountType?: 'percentage' | 'fixed'
  discountValue?: number
  onDiscountChange?: (type: 'percentage' | 'fixed', value: number) => void
}

function SortableCartRow({
  item,
  goldRate,
  silverRate,
  diamondRate,
  onUpdateItem,
  onRemoveItem,
  onDuplicateItem,
}: {
  item: CartItem
  goldRate: number
  silverRate: number
  diamondRate: number
  onUpdateItem: (itemId: string, updates: Partial<CartItem>) => void
  onRemoveItem: (itemId: string) => void
  onDuplicateItem?: (item: CartItem) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.item_id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Calculate breakdown for this item
  let rate = 0
  if (item.item.metal_type === 'Gold') {
    rate = goldRate
  } else if (item.item.metal_type === 'Silver') {
    rate = silverRate
  } else if (item.item.metal_type === 'Diamond') {
    rate = diamondRate
  }

  const metalValue = calculateGoldValue(item.weight, rate)
  const makingCharges = calculateMakingCharges(
    item.weight,
    item.item.making_charge,
    item.item.making_charge_type || 'percentage',
    metalValue
  )
  const itemSubtotal = metalValue + makingCharges

  return (
    <TableRow ref={setNodeRef} style={style} className="text-xs sm:text-sm">
      <TableCell className="px-2 py-3 align-top">
        <div className="flex items-start gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 mt-1"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="font-medium mb-1">{item.item.name}</div>
            <div className="text-[10px] text-muted-foreground mb-2">
              {item.item.metal_type} • {item.item.purity}
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{item.item.metal_type} Value:</span>
                <span className="font-medium">{formatCurrency(metalValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Making {item.item.making_charge_type === 'percentage' ? `(${item.item.making_charge}%)` : `(₹${item.item.making_charge}/g)`}:
                </span>
                <span className="font-medium">{formatCurrency(makingCharges)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-semibold">{formatCurrency(itemSubtotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-2 py-3 align-top">
        <Input
          type="number"
          step="0.001"
          value={item.weight}
          onChange={(e) =>
            onUpdateItem(item.item_id, {
              weight: parseFloat(e.target.value) || 0,
            })
          }
          className="w-20 h-9"
        />
        <div className="text-[10px] text-muted-foreground mt-1">grams</div>
      </TableCell>
      <TableCell className="px-2 py-3 align-top">
        <Input
          type="number"
          value={item.quantity}
          onChange={(e) =>
            onUpdateItem(item.item_id, {
              quantity: parseInt(e.target.value) || 1,
            })
          }
          className="w-16 h-9"
          min="1"
        />
        {item.quantity > 1 && (
          <div className="text-[10px] text-muted-foreground mt-1">
            × {item.quantity}
          </div>
        )}
      </TableCell>
      <TableCell className="text-right px-2 py-3 align-top">
        <div className="font-bold text-base">
          {formatCurrency(itemSubtotal * item.quantity)}
        </div>
        {item.quantity > 1 && (
          <div className="text-[10px] text-muted-foreground mt-1">
            {formatCurrency(itemSubtotal)} each
          </div>
        )}
      </TableCell>
      <TableCell className="px-2 py-3 align-top">
        <div className="flex flex-col gap-1">
          {onDuplicateItem && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDuplicateItem(item)}
              title="Duplicate item"
              className="h-8 w-8 p-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveItem(item.item_id)}
            title="Remove item"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default function InvoicePreview({
  cart,
  goldRate,
  silverRate = 0,
  diamondRate = 0,
  gstRate,
  onRemoveItem,
  onUpdateItem,
  onReorderItems,
  onDuplicateItem,
  discountType = 'percentage',
  discountValue = 0,
  onDiscountChange,
}: InvoicePreviewProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [isPrintMode, setIsPrintMode] = useState(false)
  const [showDiscount, setShowDiscount] = useState(false)
  const [localDiscountType, setLocalDiscountType] = useState<'percentage' | 'fixed'>(discountType)
  const [localDiscountValue, setLocalDiscountValue] = useState(discountValue)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  const totals = useMemo(() => {
    let totalGoldValue = 0
    let totalMakingCharges = 0

    cart.forEach((item) => {
      // Get the appropriate rate based on metal type
      let rate = 0
      if (item.item.metal_type === 'Gold') {
        rate = goldRate
      } else if (item.item.metal_type === 'Silver') {
        rate = silverRate
      } else if (item.item.metal_type === 'Diamond') {
        rate = diamondRate
      }

      const goldValue = calculateGoldValue(item.weight, rate)
      const makingCharges = calculateMakingCharges(
        item.weight,
        item.item.making_charge,
        item.item.making_charge_type || 'percentage',
        goldValue
      )

      totalGoldValue += goldValue * item.quantity
      totalMakingCharges += makingCharges * item.quantity
    })

    const subtotal = totalGoldValue + totalMakingCharges

    // Calculate discount
    let discountAmount = 0
    if (localDiscountValue > 0) {
      if (localDiscountType === 'percentage') {
        discountAmount = (subtotal * localDiscountValue) / 100
      } else {
        discountAmount = localDiscountValue
      }
    }

    const afterDiscount = subtotal - discountAmount
    const gstAmount = calculateGST(afterDiscount, 0, gstRate)
    const grandTotal = afterDiscount + gstAmount

    return {
      goldValue: totalGoldValue,
      makingCharges: totalMakingCharges,
      subtotal,
      discountAmount,
      afterDiscount,
      gstAmount,
      grandTotal,
    }
  }, [cart, goldRate, silverRate, diamondRate, gstRate, localDiscountType, localDiscountValue])

  // Update item calculations when totals change
  useEffect(() => {
    if (cart.length === 0) return

    cart.forEach((item) => {
      // Get the appropriate rate based on metal type
      let rate = 0
      if (item.item.metal_type === 'Gold') {
        rate = goldRate
      } else if (item.item.metal_type === 'Silver') {
        rate = silverRate
      } else if (item.item.metal_type === 'Diamond') {
        rate = diamondRate
      }

      const goldValue = calculateGoldValue(item.weight, rate)
      const makingCharges = calculateMakingCharges(
        item.weight,
        item.item.making_charge,
        item.item.making_charge_type || 'percentage',
        goldValue
      )
      const newGoldValue = goldValue
      const newMakingCharges = makingCharges
      const newSubtotal = goldValue + makingCharges

      // Only update if values have changed to prevent infinite loops
      if (
        item.gold_value !== newGoldValue ||
        item.making_charges !== newMakingCharges ||
        item.subtotal !== newSubtotal
      ) {
        onUpdateItem(item.item_id, {
          gold_value: newGoldValue,
          making_charges: newMakingCharges,
          subtotal: newSubtotal,
        })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, goldRate, silverRate, diamondRate])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id && onReorderItems) {
      const oldIndex = cart.findIndex((item) => item.item_id === active.id)
      const newIndex = cart.findIndex((item) => item.item_id === over.id)
      const newCart = arrayMove(cart, oldIndex, newIndex)
      onReorderItems(newCart)
    }
  }

  const handleBulkQuantityUpdate = (quantity: number) => {
    selectedItems.forEach((itemId) => {
      onUpdateItem(itemId, { quantity })
    })
    setSelectedItems(new Set())
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

  const breakdownData = useMemo(() => {
    return [
      { name: 'Gold Value', value: totals.goldValue },
      { name: 'Making Charges', value: totals.makingCharges },
      { name: 'GST', value: totals.gstAmount },
    ]
  }, [totals])

  const handleSaveDraft = () => {
    const draft = {
      cart,
      goldRate,
      customerId: null, // Will be set from parent
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem('invoice_draft', JSON.stringify(draft))
    toast.success('Draft saved', 'Invoice draft saved successfully')
  }

  const handlePrint = () => {
    setIsPrintMode(true)
    setTimeout(() => {
      window.print()
      setIsPrintMode(false)
    }, 100)
  }

  if (cart.length === 0) {
    return <p className="text-center text-muted-foreground">Cart is empty</p>
  }

  return (
    <div className={`space-y-4 ${isPrintMode ? 'print-mode' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="flex-1 sm:flex-none"
        >
          <PieChart className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">{showBreakdown ? 'Hide' : 'Show'} Breakdown</span>
          <span className="sm:hidden">Breakdown</span>
        </Button>
        <Button variant="outline" size="sm" onClick={handleSaveDraft} className="flex-1 sm:flex-none">
          <Save className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Save Draft</span>
          <span className="sm:hidden">Save</span>
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1 sm:flex-none">
          <Printer className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Print</span>
          <span className="sm:hidden">Print</span>
        </Button>
      </div>

      {showBreakdown && (
        <div className="rounded-md border p-4">
          <h4 className="mb-4 text-sm font-semibold">Revenue Breakdown</h4>
          <RevenueChart data={breakdownData} />
        </div>
      )}
      {selectedItems.size > 0 && (
        <div className="flex items-center justify-between rounded-md border bg-muted p-2">
          <span className="text-sm">
            {selectedItems.size} item(s) selected
          </span>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Set quantity"
              className="w-20"
              min="1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement
                  handleBulkQuantityUpdate(parseInt(input.value) || 1)
                  input.value = ''
                }
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedItems(new Set())}
            >
              Clear
            </Button>
          </div>
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="max-h-64 overflow-y-auto overflow-x-auto rounded-md border scrollbar-hide">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="text-xs uppercase tracking-wider">
                <TableHead className="w-[30px] px-2 h-10"></TableHead>
                <TableHead className="px-2 h-10">Item</TableHead>
                <TableHead className="px-2 h-10">Weight</TableHead>
                <TableHead className="px-2 h-10">Qty</TableHead>
                <TableHead className="text-right px-2 h-10">Amount</TableHead>
                <TableHead className="w-[80px] px-2 h-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext
                items={cart.map((item) => item.item_id)}
                strategy={verticalListSortingStrategy}
              >
                {cart.map((item) => (
                  <SortableCartRow
                    key={item.item_id}
                    item={item}
                    goldRate={goldRate}
                    silverRate={silverRate}
                    diamondRate={diamondRate}
                    onUpdateItem={onUpdateItem}
                    onRemoveItem={onRemoveItem}
                    onDuplicateItem={onDuplicateItem}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </div>
      </DndContext>

      {/* Discount Section */}
      <div className="border-t pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDiscount(!showDiscount)}
          className="w-full sm:w-auto"
        >
          <Tag className="mr-2 h-4 w-4" />
          {showDiscount ? 'Hide' : 'Add'} Discount
        </Button>

        {showDiscount && (
          <div className="mt-3 space-y-3 rounded-lg border p-3 bg-muted/30">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={localDiscountType === 'percentage' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setLocalDiscountType('percentage')
                  onDiscountChange?.('percentage', localDiscountValue)
                }}
                className="flex-1 sm:flex-none"
              >
                <Percent className="mr-2 h-3.5 w-3.5" />
                Percentage
              </Button>
              <Button
                variant={localDiscountType === 'fixed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setLocalDiscountType('fixed')
                  onDiscountChange?.('fixed', localDiscountValue)
                }}
                className="flex-1 sm:flex-none"
              >
                <Tag className="mr-2 h-3.5 w-3.5" />
                Fixed Amount
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                step={localDiscountType === 'percentage' ? '0.1' : '1'}
                max={localDiscountType === 'percentage' ? '100' : undefined}
                value={localDiscountValue}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  setLocalDiscountValue(value)
                  onDiscountChange?.(localDiscountType, value)
                }}
                placeholder={localDiscountType === 'percentage' ? 'Enter %' : 'Enter amount'}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {localDiscountType === 'percentage' ? '%' : '₹'}
              </span>
            </div>

            {totals.discountAmount > 0 && (
              <div className="text-sm text-green-600 dark:text-green-400">
                Discount: {formatCurrency(totals.discountAmount)}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2 border-t pt-4">
        <div className="flex justify-between text-sm">
          <span>Gold Value:</span>
          <span>{formatCurrency(totals.goldValue)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Making Charges:</span>
          <span>{formatCurrency(totals.makingCharges)}</span>
        </div>
        <div className="flex justify-between text-sm font-medium">
          <span>Subtotal:</span>
          <span>{formatCurrency(totals.subtotal)}</span>
        </div>

        {totals.discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
            <span>
              Discount {localDiscountType === 'percentage' ? `(${localDiscountValue}%)` : ''}:
            </span>
            <span>- {formatCurrency(totals.discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span>GST ({gstRate}%):</span>
          <span>{formatCurrency(totals.gstAmount)}</span>
        </div>
        <div className="flex justify-between border-t pt-2 font-bold">
          <span>Grand Total:</span>
          <span>{formatCurrency(totals.grandTotal)}</span>
        </div>
      </div>
    </div>
  )
}

