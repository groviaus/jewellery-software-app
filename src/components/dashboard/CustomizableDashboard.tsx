'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import StatsCards from '@/components/dashboard/StatsCards'
import RecentSales from '@/components/dashboard/RecentSales'
import SalesTrendChart from '@/components/dashboard/SalesTrendChart'
import RevenueComparison from '@/components/dashboard/RevenueComparison'
import DashboardControls from '@/components/dashboard/DashboardControls'
import SortableWidget from '@/components/dashboard/SortableWidget'
import {
  getDashboardPreferences,
  updateWidgetOrder,
  type DashboardWidget,
} from '@/lib/utils/dashboard-preferences'
import { useQueryClient } from '@tanstack/react-query'

interface CustomizableDashboardProps {
  todaySales: number
  totalStock: number
  recentInvoices: any[]
}

export default function CustomizableDashboard({
  todaySales,
  totalStock,
  recentInvoices,
}: CustomizableDashboardProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({})
  const queryClient = useQueryClient()

  useEffect(() => {
    const prefs = getDashboardPreferences()
    setWidgets(prefs.widgets)
    setDateRange(prefs.dateRange)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setWidgets((items) => {
        // Helper function to extract widget IDs from a sortable ID (could be widget ID or grid group ID)
        const getWidgetIds = (sortableId: string): string[] => {
          if (sortableId.startsWith('grid-')) {
            // Extract widget IDs from grid group ID
            return sortableId.replace('grid-', '').split('-')
          }
          return [sortableId]
        }

        const activeWidgetIds = getWidgetIds(active.id as string)
        const overWidgetIds = getWidgetIds(over.id as string)

        // IMPORTANT: Work with sorted items to get correct positions
        const sortedItems = [...items].sort((a, b) => a.order - b.order)

        // Find the position of the first widget in each group in the SORTED array
        const oldIndex = sortedItems.findIndex((item) => activeWidgetIds.includes(item.id))
        const newIndex = sortedItems.findIndex((item) => overWidgetIds.includes(item.id))

        if (oldIndex === -1 || newIndex === -1) return items

        // Move all widgets in the active group
        let newItems = [...sortedItems]
        const widgetsToMove = activeWidgetIds.map(id => sortedItems.find(item => item.id === id)!).filter(Boolean)

        // Remove the widgets to move
        newItems = newItems.filter(item => !activeWidgetIds.includes(item.id))

        // Calculate the new insertion index
        // Find the last widget in the "over" group in the filtered array
        let adjustedNewIndex = -1
        for (let i = newItems.length - 1; i >= 0; i--) {
          if (overWidgetIds.includes(newItems[i].id)) {
            adjustedNewIndex = i
            break
          }
        }

        if (adjustedNewIndex === -1) return items

        // If dragging down, insert after the target group; if dragging up, insert before
        const insertIndex = oldIndex < newIndex ? adjustedNewIndex + 1 : adjustedNewIndex

        // Insert the widgets at the new position
        newItems.splice(insertIndex, 0, ...widgetsToMove)

        // Update order property
        newItems = newItems.map((item, index) => ({ ...item, order: index }))

        updateWidgetOrder(newItems.map((w) => w.id))
        return newItems
      })
    }
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries()
  }

  const handleWidgetVisibilityChange = (newWidgets: DashboardWidget[]) => {
    setWidgets(newWidgets)
  }

  const handleDateRangeChange = (startDate?: string, endDate?: string) => {
    setDateRange({ startDate, endDate })
    queryClient.invalidateQueries()
  }

  const visibleWidgets = widgets
    .filter((w) => w.visible)
    .sort((a, b) => a.order - b.order)

  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.id) {
      case 'stats':
        return <StatsCards todaySales={todaySales} totalStock={totalStock} />
      case 'sales-trend':
        return <SalesTrendChart initialInvoices={recentInvoices || []} />
      case 'recent-sales':
        return <RecentSales invoices={recentInvoices || []} />
      case 'revenue-comparison':
        return <RevenueComparison />
      case 'quick-actions':
        return (
          <div className="rounded-lg border bg-card p-4 sm:p-6">
            <h2 className="mb-3 sm:mb-4 text-lg sm:text-xl font-semibold text-card-foreground">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              <a href="/inventory" className="w-full">
                <button className="w-full rounded-md border border-input bg-secondary px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                  View Inventory
                </button>
              </a>
              <a href="/customers" className="w-full">
                <button className="w-full rounded-md border border-input bg-secondary px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                  View Customers
                </button>
              </a>
              <a href="/reports" className="w-full">
                <button className="w-full rounded-md border border-input bg-secondary px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                  View Reports
                </button>
              </a>
              <a href="/settings" className="w-full">
                <button className="w-full rounded-md border border-input bg-secondary px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                  Settings
                </button>
              </a>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  // Group widgets that should be in a grid layout
  const shouldBeInGrid = (widgetId: string) => {
    return widgetId === 'recent-sales' || widgetId === 'revenue-comparison'
  }

  // Create sortable items - each item is either a single widget or a group ID
  const groupedWidgets: (DashboardWidget | DashboardWidget[])[] = []
  const sortableIds: string[] = []
  let currentGroup: DashboardWidget[] = []

  visibleWidgets.forEach((widget, index) => {
    if (shouldBeInGrid(widget.id)) {
      currentGroup.push(widget)
      // If this is the last widget or next widget shouldn't be in grid, finalize group
      if (index === visibleWidgets.length - 1 || !shouldBeInGrid(visibleWidgets[index + 1]?.id)) {
        if (currentGroup.length === 1) {
          groupedWidgets.push(currentGroup[0])
          sortableIds.push(currentGroup[0].id)
        } else {
          // Create a group ID for the grid container
          const groupId = `grid-${currentGroup.map(w => w.id).join('-')}`
          groupedWidgets.push([...currentGroup])
          sortableIds.push(groupId)
        }
        currentGroup = []
      }
    } else {
      if (currentGroup.length > 0) {
        const groupId = `grid-${currentGroup.map(w => w.id).join('-')}`
        groupedWidgets.push([...currentGroup])
        sortableIds.push(groupId)
        currentGroup = []
      }
      groupedWidgets.push(widget)
      sortableIds.push(widget.id)
    }
  })

  return (
    <div className="space-y-6 sm:space-y-8">
      <DashboardControls
        onRefresh={handleRefresh}
        onWidgetVisibilityChange={handleWidgetVisibilityChange}
        onDateRangeChange={handleDateRangeChange}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortableIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4 sm:space-y-6">
            {groupedWidgets.map((widgetOrGroup, index) => {
              if (Array.isArray(widgetOrGroup)) {
                // Render grid layout for grouped widgets as a single sortable unit
                const groupId = `grid-${widgetOrGroup.map(w => w.id).join('-')}`
                return (
                  <SortableWidget key={groupId} id={groupId}>
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
                      {widgetOrGroup.map((widget) => (
                        <div key={widget.id}>
                          {renderWidget(widget)}
                        </div>
                      ))}
                    </div>
                  </SortableWidget>
                )
              } else {
                return (
                  <SortableWidget key={widgetOrGroup.id} id={widgetOrGroup.id}>
                    {renderWidget(widgetOrGroup)}
                  </SortableWidget>
                )
              }
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

