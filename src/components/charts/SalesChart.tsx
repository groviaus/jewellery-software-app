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
import { useIsMobile } from '@/hooks/use-mobile'

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
  const isMobile = useIsMobile()
  const [isTablet, setIsTablet] = useState(false)
  
  useEffect(() => {
    const checkTablet = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024)
    }
    checkTablet()
    window.addEventListener('resize', checkTablet)
    return () => window.removeEventListener('resize', checkTablet)
  }, [])

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
        <div className="rounded-lg border bg-background p-2 sm:p-3 shadow-md text-xs sm:text-sm">
          <p className="mb-1 sm:mb-2 font-medium">{payload[0].payload.date}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
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
      <div className="flex h-[250px] sm:h-[300px] md:h-[350px] items-center justify-center">
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

  // Responsive values - minimized margins to reduce negative space
  const margin = isMobile 
    ? { top: 10, right: 10, left: 30, bottom: 20 }
    : isTablet
    ? { top: 5, right: 15, left: 45, bottom: 10 }
    : { top: 5, right: 50, left: 70, bottom: 5 }
  const fontSize = isMobile ? 9 : isTablet ? 11 : 12
  const revenueAxisWidth = isMobile ? 30 : isTablet ? 45 : 65
  const invoicesAxisWidth = isMobile ? 20 : isTablet ? 30 : 45
  const strokeWidth = isMobile ? 2 : isTablet ? 2.5 : 3
  const dotRadius = isMobile ? 3 : isTablet ? 3.5 : 4
  const activeDotRadius = isMobile ? 5 : isTablet ? 5.5 : 6

  return (
    <div className={`w-full h-[250px] sm:h-[300px] md:h-[350px]`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={margin}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            fontSize={fontSize}
            tickLine={false}
            axisLine={false}
            angle={isMobile ? -45 : 0}
            textAnchor={isMobile ? 'end' : 'middle'}
            height={isMobile ? 50 : 30}
          />
          <YAxis
            yAxisId="revenue"
            stroke={themeColors.revenue}
            fontSize={fontSize}
            tickLine={false}
            axisLine={false}
            domain={revenueDomain}
            tickFormatter={(value) => {
              if (isMobile && value >= 1000000) {
                return `₹${(value / 1000000).toFixed(1)}M`
              }
              if (isMobile && value >= 1000) {
                return `₹${(value / 1000).toFixed(0)}K`
              }
              return `₹${value.toLocaleString()}`
            }}
            width={revenueAxisWidth}
          />
          <YAxis
            yAxisId="invoices"
            orientation="right"
            stroke={themeColors.invoices}
            fontSize={fontSize}
            tickLine={false}
            axisLine={false}
            domain={invoicesDomain}
            width={invoicesAxisWidth}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: isMobile ? '10px' : '20px' }}
            formatter={(value) => value === 'revenue' ? 'Revenue' : 'Invoices'}
            iconSize={isMobile ? 10 : 12}
            fontSize={isMobile ? 11 : 12}
          />
          <Line
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            stroke={themeColors.revenue}
            strokeWidth={strokeWidth}
            dot={{ fill: themeColors.revenue, r: dotRadius, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: activeDotRadius, strokeWidth: 2, stroke: '#fff' }}
            name="revenue"
          />
          <Line
            yAxisId="invoices"
            type="monotone"
            dataKey="invoices"
            stroke={themeColors.invoices}
            strokeWidth={strokeWidth}
            dot={{ fill: themeColors.invoices, r: dotRadius, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: activeDotRadius, strokeWidth: 2, stroke: '#fff' }}
            name="invoices"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

