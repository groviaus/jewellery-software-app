'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RefreshCw, Settings, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import {
  getDashboardPreferences,
  updateWidgetVisibility,
  updateDateRange,
  updateLastUpdated,
  type DashboardWidget,
} from '@/lib/utils/dashboard-preferences'

interface DashboardControlsProps {
  onRefresh: () => void
  onWidgetVisibilityChange: (widgets: DashboardWidget[]) => void
  onDateRangeChange: (startDate?: string, endDate?: string) => void
}

export default function DashboardControls({
  onRefresh,
  onWidgetVisibilityChange,
  onDateRangeChange,
}: DashboardControlsProps) {
  const [prefs, setPrefs] = useState(getDashboardPreferences())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [startDate, setStartDate] = useState(
    prefs.dateRange.startDate || format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd')
  )
  const [endDate, setEndDate] = useState(
    prefs.dateRange.endDate || format(new Date(), 'yyyy-MM-dd')
  )

  useEffect(() => {
    const currentPrefs = getDashboardPreferences()
    setPrefs(currentPrefs)
    if (currentPrefs.dateRange.startDate) {
      setStartDate(currentPrefs.dateRange.startDate)
    }
    if (currentPrefs.dateRange.endDate) {
      setEndDate(currentPrefs.dateRange.endDate)
    }
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    updateLastUpdated()
    onRefresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const handleWidgetToggle = (widgetId: string, visible: boolean) => {
    updateWidgetVisibility(widgetId, visible)
    const updatedPrefs = getDashboardPreferences()
    setPrefs(updatedPrefs)
    onWidgetVisibilityChange(updatedPrefs.widgets)
  }

  const handleDateRangeApply = () => {
    updateDateRange(startDate, endDate)
    onDateRangeChange(startDate, endDate)
    setShowDatePicker(false)
  }

  const handleDatePreset = (preset: 'today' | 'week' | 'month' | 'year') => {
    const today = new Date()
    let newStartDate = ''
    let newEndDate = format(today, 'yyyy-MM-dd')

    switch (preset) {
      case 'today':
        newStartDate = format(today, 'yyyy-MM-dd')
        break
      case 'week':
        const weekAgo = new Date(today)
        weekAgo.setDate(today.getDate() - 7)
        newStartDate = format(weekAgo, 'yyyy-MM-dd')
        break
      case 'month':
        const monthAgo = new Date(today)
        monthAgo.setMonth(today.getMonth() - 1)
        newStartDate = format(monthAgo, 'yyyy-MM-dd')
        break
      case 'year':
        newStartDate = format(new Date(today.getFullYear(), 0, 1), 'yyyy-MM-dd')
        break
    }

    setStartDate(newStartDate)
    setEndDate(newEndDate)
    updateDateRange(newStartDate, newEndDate)
    onDateRangeChange(newStartDate, newEndDate)
  }

  const widgetLabels: Record<string, string> = {
    stats: 'Statistics Cards',
    'sales-trend': 'Sales Trend Chart',
    'recent-sales': 'Recent Sales',
    'revenue-comparison': 'Revenue Comparison',
    'quick-actions': 'Quick Actions',
  }

  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex items-center justify-between gap-1.5 sm:gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs sm:text-sm px-2 sm:px-3"
          >
            <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''} sm:mr-2`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {prefs.lastUpdated && (
            <span className="text-xs text-muted-foreground whitespace-nowrap  min-[400px]:inline">
              <span className="hidden sm:inline">Last updated: </span>
              <span className="sm:hidden">Updated: </span>
              <span className="hidden md:inline">{format(new Date(prefs.lastUpdated), 'MMM dd, yyyy HH:mm')}</span>
              <span className="md:hidden">{format(new Date(prefs.lastUpdated), 'MMM dd, HH:mm')}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <DropdownMenu open={showDatePicker} onOpenChange={setShowDatePicker}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Date Range</span>
                <span className="sm:hidden">Date</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Select Date Range</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-4 space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDatePreset('today')}
                    className="flex-1"
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDatePreset('week')}
                    className="flex-1"
                  >
                    This Week
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDatePreset('month')}
                    className="flex-1"
                  >
                    This Month
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDatePreset('year')}
                    className="flex-1"
                  >
                    This Year
                  </Button>
                </div>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="start_date" className="text-xs">
                      Start Date
                    </Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date" className="text-xs">
                      End Date
                    </Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button onClick={handleDateRangeApply} className="w-full" size="sm">
                    Apply
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Widgets</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle Widgets</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {prefs.widgets
                .sort((a, b) => a.order - b.order)
                .map((widget) => (
                  <DropdownMenuCheckboxItem
                    key={widget.id}
                    checked={widget.visible}
                    onCheckedChange={(checked) =>
                      handleWidgetToggle(widget.id, checked as boolean)
                    }
                  >
                    {widgetLabels[widget.id] || widget.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

