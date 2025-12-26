'use client'

import { useMemo, useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils/calculations'
import { format } from 'date-fns'

interface SalesDataPoint {
  date: string
  revenue: number
  invoices: number
}

interface SalesChartProps {
  data: SalesDataPoint[]
  period?: 'daily' | 'weekly' | 'monthly'
}

export default function SalesChart({ data, period = 'daily' }: SalesChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    return data.map((point) => ({
      date: format(new Date(point.date), period === 'daily' ? 'MMM dd' : period === 'weekly' ? 'MMM dd' : 'MMM'),
      revenue: Number(point.revenue) || 0,
      invoices: Number(point.invoices) || 0,
    }))
  }, [data, period])

  // Use theme-aware colors - detect dark mode
  const [themeColors, setThemeColors] = useState({ revenue: '#3b82f6', invoices: '#10b981' })
  
  useEffect(() => {
    const updateColors = () => {
      if (typeof window !== 'undefined') {
        const root = document.documentElement
        const isDark = root.classList.contains('dark')
        
        // Use visible, contrasting colors that work in both themes
        setThemeColors({
          revenue: isDark ? '#8b5cf6' : '#3b82f6', // Purple/Blue
          invoices: isDark ? '#10b981' : '#059669', // Green
        })
      }
    }
    
    updateColors()
    
    // Watch for theme changes
    const observer = new MutationObserver(updateColors)
    if (typeof window !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      })
    }
    
    return () => observer.disconnect()
  }, [])

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; payload: { date: string } }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-3 shadow-md">
          <p className="mb-2 font-medium">{payload[0].payload.date}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name === 'revenue' ? 'Revenue' : 'Invoices'}:{' '}
              {entry.name === 'revenue' 
                ? formatCurrency(entry.value) 
                : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-muted-foreground">No data available</p>
      </div>
    )
  }

  // Calculate Y-axis domains for dual axis
  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 0)
  const maxInvoices = Math.max(...chartData.map(d => d.invoices), 0)
  const revenueDomain: [number, number] = maxRevenue > 0 
    ? [0, Math.max(maxRevenue * 1.1, 1000)] 
    : [0, 1000]
  const invoicesDomain: [number, number] = maxInvoices > 0
    ? [0, Math.max(maxInvoices * 1.1, 5)]
    : [0, 5]

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 50,
            left: 70,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="revenue"
            stroke={themeColors.revenue}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={revenueDomain}
            tickFormatter={(value) => `₹${value.toLocaleString()}`}
            width={65}
          />
          <YAxis
            yAxisId="invoices"
            orientation="right"
            stroke={themeColors.invoices}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={invoicesDomain}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => value === 'revenue' ? 'Revenue' : 'Invoices'}
          />
          <Line
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            stroke={themeColors.revenue}
            strokeWidth={3}
            dot={{ fill: themeColors.revenue, r: 4, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
            name="revenue"
          />
          <Line
            yAxisId="invoices"
            type="monotone"
            dataKey="invoices"
            stroke={themeColors.invoices}
            strokeWidth={3}
            dot={{ fill: themeColors.invoices, r: 4, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
            name="invoices"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

