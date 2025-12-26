'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/calculations'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'

async function fetchMonthlyRevenue(year: number, month: number): Promise<number> {
  const startDate = new Date(year, month, 1)
  const endDate = new Date(year, month + 1, 0, 23, 59, 59)

  const params = new URLSearchParams()
  params.append('start_date', startDate.toISOString().split('T')[0])
  params.append('end_date', endDate.toISOString().split('T')[0])

  const response = await fetch(`/api/reports/daily?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch monthly revenue')
  }
  const data = await response.json()

  // Sum up all daily revenues
  const dailyReports = data.data || []
  return dailyReports.reduce((sum: number, report: any) => sum + report.total_revenue, 0)
}

export default function RevenueComparison() {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

  // Fetch this month's revenue
  const { data: thisMonthRevenue, isLoading: loadingThisMonth } = useQuery({
    queryKey: ['revenue', 'month', currentYear, currentMonth],
    queryFn: () => fetchMonthlyRevenue(currentYear, currentMonth),
  })

  // Fetch last month's revenue
  const { data: lastMonthRevenue, isLoading: loadingLastMonth } = useQuery({
    queryKey: ['revenue', 'month', lastMonthYear, lastMonth],
    queryFn: () => fetchMonthlyRevenue(lastMonthYear, lastMonth),
  })

  const comparison = useMemo(() => {
    if (!thisMonthRevenue || !lastMonthRevenue) {
      return null
    }

    const difference = thisMonthRevenue - lastMonthRevenue
    const percentageChange = lastMonthRevenue > 0
      ? (difference / lastMonthRevenue) * 100
      : 0

    return {
      difference,
      percentageChange,
      isPositive: difference >= 0,
    }
  }, [thisMonthRevenue, lastMonthRevenue])

  const isLoading = loadingThisMonth || loadingLastMonth

  if (isLoading) {
    return (
      <Card className="h-[340px] flex flex-col">
        <CardHeader>
          <CardTitle>Revenue Comparison</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <Card className="h-auto lg:h-[330px] flex flex-col">
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-lg sm:text-xl">Revenue Comparison</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-4 sm:space-y-6">
          {/* This Month */}
          <div className="flex items-center justify-between rounded-lg border p-3 sm:p-4">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">This Month</p>
              <p className="text-xl sm:text-2xl font-bold">{formatCurrency(thisMonthRevenue || 0)}</p>
              <p className="text-xs text-muted-foreground">
                {monthNames[currentMonth]} {currentYear}
              </p>
            </div>
            <div className="rounded-full bg-blue-500/20 dark:bg-blue-500/10 p-2 sm:p-3">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          {/* Last Month */}
          <div className="flex items-center justify-between rounded-lg border p-3 sm:p-4">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Last Month</p>
              <p className="text-xl sm:text-2xl font-bold">{formatCurrency(lastMonthRevenue || 0)}</p>
              <p className="text-xs text-muted-foreground">
                {monthNames[lastMonth]} {lastMonthYear}
              </p>
            </div>
            <div className="rounded-full bg-muted p-2 sm:p-3">
              <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
            </div>
          </div>

          {/* Comparison */}
          {comparison && (
            <div className={`rounded-lg border p-3 sm:p-4 ${comparison.isPositive
              ? 'bg-green-500/20 dark:bg-green-500/10 border-green-500/30 dark:border-green-500/20'
              : 'bg-red-500/20 dark:bg-red-500/10 border-red-500/30 dark:border-red-500/20'
              }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-foreground">Change</p>
                  <p className={`text-lg sm:text-xl font-bold ${comparison.isPositive
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-red-700 dark:text-red-400'
                    }`}>
                    {comparison.isPositive ? '+' : ''}{formatCurrency(comparison.difference)}
                  </p>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  {comparison.isPositive ? (
                    <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
                  )}
                  <span className={`text-base sm:text-lg font-semibold ${comparison.isPositive
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-red-700 dark:text-red-400'
                    }`}>
                    {comparison.percentageChange >= 0 ? '+' : ''}
                    {comparison.percentageChange.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

