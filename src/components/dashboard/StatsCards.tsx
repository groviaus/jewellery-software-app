'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/calculations'
import { TrendingUp, Package, DollarSign, AlertTriangle } from 'lucide-react'
import { useTodayInvoices } from '@/lib/hooks/useInvoices'
import { useInventory } from '@/lib/hooks/useInventory'
import { useSettings } from '@/lib/hooks/useSettings'
import { useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface StatsCardsProps {
  todaySales?: number
  totalStock?: number
}

export default function StatsCards({ todaySales: initialTodaySales, totalStock: initialTotalStock }: StatsCardsProps) {
  // Use server-provided data as primary, React Query for updates
  const { data: todayInvoices } = useTodayInvoices({ initialData: [] })
  const { data: items } = useInventory()
  const { data: settings } = useSettings()
  const stockAlertThreshold = settings?.stock_alert_threshold || 5

  const todaySales = useMemo(() => {
    // Prefer server-provided data, fallback to calculated from React Query
    if (initialTodaySales !== undefined) {
      return initialTodaySales
    }
    if (todayInvoices && todayInvoices.length > 0) {
      return todayInvoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount.toString()), 0)
    }
    return 0
  }, [todayInvoices, initialTodaySales])

  const totalStock = useMemo(() => {
    // Prefer server-provided data, fallback to calculated from React Query
    if (initialTotalStock !== undefined) {
      return initialTotalStock
    }
    if (items && items.length > 0) {
      return items.reduce((sum, item) => sum + item.quantity, 0)
    }
    return 0
  }, [items, initialTotalStock])

  const lowStockCount = useMemo(() => {
    if (!items || items.length === 0) return 0
    return items.filter((item) => item.quantity <= stockAlertThreshold && item.quantity > 0).length
  }, [items, stockAlertThreshold])

  const outOfStockCount = useMemo(() => {
    if (!items || items.length === 0) return 0
    return items.filter((item) => item.quantity === 0).length
  }, [items])

  return (
    <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Today's Sales</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{formatCurrency(todaySales)}</div>
          <p className="text-xs text-muted-foreground">
            Revenue from today's transactions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Total Stock</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{totalStock}</div>
          <p className="text-xs text-muted-foreground">
            Total items in inventory
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Low Stock</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-500 dark:text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">{lowStockCount}</div>
          <p className="text-xs text-muted-foreground">
            Items need restocking
          </p>
          {lowStockCount > 0 && (
            <Link href="/inventory" className="mt-2 block">
              <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                View Items →
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {outOfStockCount > 0 && (
        <Card className="border-red-500/30 dark:border-red-500/20 bg-red-500/20 dark:bg-red-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-red-700 dark:text-red-400">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">{outOfStockCount}</div>
            <p className="text-xs text-red-700 dark:text-red-400">
              Items need immediate attention
            </p>
            <Link href="/inventory" className="mt-2 block">
              <Button variant="link" size="sm" className="h-auto p-0 text-xs text-red-700 dark:text-red-400">
                View Items →
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

