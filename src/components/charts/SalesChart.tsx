'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { formatCurrency } from '@/lib/utils/calculations'
import { format } from 'date-fns'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'

interface SalesDataPoint {
  date: string
  revenue: number
  invoices: number
}

interface SalesChartProps {
  data: SalesDataPoint[]
  period?: 'daily' | 'weekly' | 'monthly'
}

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--chart-1))',
  },
  invoices: {
    label: 'Invoices',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

export default function SalesChart({ data, period = 'daily' }: SalesChartProps) {
  const chartData = useMemo(() => {
    return data.map((point) => ({
      date: format(new Date(point.date), period === 'daily' ? 'MMM dd' : period === 'weekly' ? 'MMM dd' : 'MMM'),
      revenue: point.revenue,
      invoices: point.invoices,
    }))
  }, [data, period])

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <LineChart
        data={chartData}
        margin={{
          left: 12,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => `₹${value.toLocaleString()}`}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent 
            formatter={(value, name) => {
              if (name === 'revenue') {
                return [formatCurrency(value as number), 'Revenue']
              }
              return [value, 'Invoices']
            }}
          />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="revenue"
          type="natural"
          stroke="var(--color-revenue)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          dataKey="invoices"
          type="natural"
          stroke="var(--color-invoices)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  )
}

