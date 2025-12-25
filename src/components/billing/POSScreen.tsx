'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ItemSelector from './ItemSelector'
import CustomerSelector from './CustomerSelector'
import InvoicePreview from './InvoicePreview'
import type { CartItem } from '@/lib/types/billing'
import { ShoppingCart, X, History } from 'lucide-react'
import { useSettings } from '@/lib/hooks/useSettings'
import { useCreateInvoice } from '@/lib/hooks/useInvoices'
import { toast } from '@/lib/utils/toast'
import { getLastGoldRate, saveGoldRate, getGoldRateHistory } from '@/lib/utils/gold-rate'

export default function POSScreen() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [goldRate, setGoldRate] = useState<string>('')
  const [error, setError] = useState('')

  // Fetch settings using React Query hook
  const { data: settings } = useSettings()
  const gstRate = settings?.gst_rate || 3.0

  const createInvoiceMutation = useCreateInvoice()

  // Load last used gold rate on mount
  useEffect(() => {
    const lastRate = getLastGoldRate()
    if (lastRate) {
      setGoldRate(lastRate.toString())
    }
  }, [])

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.item_id === item.item_id)
      if (existing) {
        return prev.map((i) =>
          i.item_id === item.item_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, item]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.item_id !== itemId))
  }

  const updateCartItem = useCallback((itemId: string, updates: Partial<CartItem>) => {
    setCart((prev) =>
      prev.map((item) =>
        item.item_id === itemId ? { ...item, ...updates } : item
      )
    )
  }, [])

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Cart is empty')
      toast.warning('Cart is empty', 'Please add items before checkout')
      return
    }

    if (!goldRate || parseFloat(goldRate) <= 0) {
      setError('Please enter a valid gold rate')
      toast.warning('Invalid gold rate', 'Please enter a valid gold rate')
      return
    }

    setError('')

    try {
      const invoice = await createInvoiceMutation.mutateAsync({
        customer_id: customerId,
        items: cart,
        gold_rate: parseFloat(goldRate),
      })

      // Save gold rate to history
      saveGoldRate(parseFloat(goldRate))
      
      toast.success('Invoice created successfully', `Invoice #${invoice.invoice_number}`)
      
      // Clear cart and reset form (keep gold rate)
      setCart([])
      setCustomerId(null)
      
      // Redirect to invoice page
      router.push(`/billing/invoice/${invoice.id}`)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred. Please try again.'
      setError(errorMessage)
      toast.error('Failed to create invoice', errorMessage)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Gold Rate</span>
              {getGoldRateHistory().length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const history = getGoldRateHistory()
                    if (history.length > 0) {
                      setGoldRate(history[0].rate.toString())
                    }
                  }}
                  className="text-xs"
                >
                  <History className="mr-1 h-3 w-3" />
                  Last: ₹{getLastGoldRate()?.toFixed(2)}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="gold_rate">Current Gold Rate (₹ per gram)</Label>
                <Input
                  id="gold_rate"
                  type="number"
                  step="0.01"
                  value={goldRate}
                  onChange={(e) => setGoldRate(e.target.value)}
                  placeholder="Enter gold rate"
                />
              </div>
              
              {/* Quick select buttons for recent rates */}
              {getGoldRateHistory().length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Recent Rates</Label>
                  <div className="flex flex-wrap gap-2">
                    {getGoldRateHistory().slice(0, 3).map((entry, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => setGoldRate(entry.rate.toString())}
                        className="text-xs"
                      >
                        ₹{entry.rate.toFixed(2)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Select Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerSelector
              selectedCustomerId={customerId}
              onSelect={setCustomerId}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ItemSelector onAddToCart={addToCart} />
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <InvoicePreview
              cart={cart}
              goldRate={goldRate ? parseFloat(goldRate) : 0}
              gstRate={gstRate}
              onRemoveItem={removeFromCart}
              onUpdateItem={updateCartItem}
            />

            <div className="mt-6">
              <Button
                className="w-full"
                onClick={handleCheckout}
                disabled={createInvoiceMutation.isPending || cart.length === 0 || !goldRate}
              >
                {createInvoiceMutation.isPending ? 'Processing...' : 'Generate Invoice'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

