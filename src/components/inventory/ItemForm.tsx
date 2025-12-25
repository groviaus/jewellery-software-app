'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Item, ItemFormData } from '@/lib/types/inventory'
import {
  useCreateInventoryItem,
  useUpdateInventoryItem,
} from '@/lib/hooks/useInventory'
import { toast } from '@/lib/utils/toast'

const itemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  metal_type: z.enum(['Gold', 'Silver', 'Diamond']),
  purity: z.string().min(1, 'Purity is required'),
  gross_weight: z.number().min(0, 'Gross weight must be positive'),
  net_weight: z.number().min(0, 'Net weight must be positive'),
  making_charge: z.number().min(0, 'Making charge must be positive'),
  quantity: z.number().int().min(0, 'Quantity must be non-negative'),
  sku: z.string().min(1, 'SKU is required'),
})

type ItemFormValues = z.infer<typeof itemSchema>

interface ItemFormProps {
  initialData?: Item
}

export default function ItemForm({ initialData }: ItemFormProps) {
  const router = useRouter()
  const [error, setError] = useState('')

  const createMutation = useCreateInventoryItem()
  const updateMutation = useUpdateInventoryItem()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          metal_type: initialData.metal_type,
          purity: initialData.purity,
          gross_weight: initialData.gross_weight,
          net_weight: initialData.net_weight,
          making_charge: initialData.making_charge,
          quantity: initialData.quantity,
          sku: initialData.sku,
        }
      : {
          metal_type: 'Gold',
          purity: '22K',
          quantity: 1,
        },
  })

  const metalType = watch('metal_type')
  const isLoading = createMutation.isPending || updateMutation.isPending

  const onSubmit = async (data: ItemFormValues) => {
    setError('')

    try {
      if (initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, data })
        toast.success('Item updated successfully', data.name)
      } else {
        await createMutation.mutateAsync(data as any)
        toast.success('Item created successfully', data.name)
      }
      router.push('/inventory')
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred. Please try again.'
      setError(errorMessage)
      toast.error('Failed to save item', errorMessage)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Item' : 'Add New Item'}</CardTitle>
        <CardDescription>
          {initialData
            ? 'Update the jewellery item details'
            : 'Enter details for the new jewellery item'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Gold Ring"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                {...register('sku')}
                placeholder="GR-001"
                disabled={!!initialData}
              />
              {errors.sku && (
                <p className="text-sm text-destructive">{errors.sku.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="metal_type">Metal Type *</Label>
              <Select
                value={metalType}
                onValueChange={(value) =>
                  setValue('metal_type', value as 'Gold' | 'Silver' | 'Diamond')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gold">Gold</SelectItem>
                  <SelectItem value="Silver">Silver</SelectItem>
                  <SelectItem value="Diamond">Diamond</SelectItem>
                </SelectContent>
              </Select>
              {errors.metal_type && (
                <p className="text-sm text-destructive">{errors.metal_type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="purity">Purity *</Label>
              <Input
                id="purity"
                {...register('purity')}
                placeholder="22K, 18K, 925, etc."
              />
              {errors.purity && (
                <p className="text-sm text-destructive">{errors.purity.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gross_weight">Gross Weight (g) *</Label>
              <Input
                id="gross_weight"
                type="number"
                step="0.001"
                {...register('gross_weight', { valueAsNumber: true })}
                placeholder="10.500"
              />
              {errors.gross_weight && (
                <p className="text-sm text-destructive">{errors.gross_weight.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="net_weight">Net Weight (g) *</Label>
              <Input
                id="net_weight"
                type="number"
                step="0.001"
                {...register('net_weight', { valueAsNumber: true })}
                placeholder="8.500"
              />
              {errors.net_weight && (
                <p className="text-sm text-destructive">{errors.net_weight.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="making_charge">Making Charge (₹) *</Label>
              <Input
                id="making_charge"
                type="number"
                step="0.01"
                {...register('making_charge', { valueAsNumber: true })}
                placeholder="500.00"
              />
              {errors.making_charge && (
                <p className="text-sm text-destructive">{errors.making_charge.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                {...register('quantity', { valueAsNumber: true })}
                placeholder="1"
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">{errors.quantity.message}</p>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : initialData ? 'Update Item' : 'Add Item'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/inventory')}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

