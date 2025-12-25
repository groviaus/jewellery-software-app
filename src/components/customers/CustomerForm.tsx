'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Customer } from '@/lib/types/customer'
import { useCreateCustomer, useUpdateCustomer } from '@/lib/hooks/useCustomers'
import { toast } from '@/lib/utils/toast'

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[0-9]{10,}$/, 'Phone number must contain only digits'),
})

type CustomerFormValues = z.infer<typeof customerSchema>

interface CustomerFormProps {
  initialData?: Customer
}

export default function CustomerForm({ initialData }: CustomerFormProps) {
  const router = useRouter()
  const [error, setError] = useState('')

  const createMutation = useCreateCustomer()
  const updateMutation = useUpdateCustomer()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          phone: initialData.phone,
        }
      : undefined,
  })

  const isLoading = createMutation.isPending || updateMutation.isPending

  const onSubmit = async (data: CustomerFormValues) => {
    setError('')

    try {
      if (initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, data })
        toast.success('Customer updated successfully', data.name)
      } else {
        await createMutation.mutateAsync(data)
        toast.success('Customer created successfully', data.name)
      }
      router.push('/customers')
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred. Please try again.'
      setError(errorMessage)
      toast.error('Failed to save customer', errorMessage)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Customer' : 'Add New Customer'}</CardTitle>
        <CardDescription>
          {initialData
            ? 'Update customer information'
            : 'Enter customer details'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="John Doe"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              {...register('phone')}
              placeholder="9876543210"
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : initialData ? 'Update Customer' : 'Add Customer'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/customers')}
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

