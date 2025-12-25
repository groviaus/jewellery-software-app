'use client'

import { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { formatCurrency } from '@/lib/utils/calculations'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'

interface RevenueByCategory {
  name: string
  value: number
}

interface RevenueChartProps {
  data: RevenueByCategory[]
}

export default function RevenueChart({ data }: RevenueChartProps) {
  // Create chart config from data
  const chartConfig = useMemo(() => {
    return data.reduce((acc, item, index) => {
      const key = item.name.toLowerCase().replace(/\s+/g, '_')
      acc[key] = {
        label: item.name,
        color: `hsl(var(--chart-${(index % 5) + 1}))`,
      }
      return acc
    }, {} as ChartConfig)
  }, [data])

  // Transform data to include key
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      key: item.name.toLowerCase().replace(/\s+/g, '_'),
    }))
  }, [data])

  return (
    <ChartContainer config={chartConfig} className="h-[300px]">
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent 
            formatter={(value) => formatCurrency(value as number)}
            hideLabel
          />}
        />
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          dataKey="value"
          nameKey="name"
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={`var(--color-${entry.key})`}
            />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  )
}

