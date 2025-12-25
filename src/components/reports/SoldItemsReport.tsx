'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/calculations'
import { format } from 'date-fns'
import { useSoldItemsReport } from '@/lib/hooks/useReports'
import { Skeleton } from '@/components/ui/skeleton'
import { exportToCSV } from '@/lib/utils/csv-export'
import { Download } from 'lucide-react'

export default function SoldItemsReport() {
  const { data: items = [], isLoading } = useSoldItemsReport()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sold Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleExportCSV = () => {
    if (items.length === 0) {
      return
    }

    const exportData = items.map((item) => ({
      'Item Name': item.item_name,
      SKU: item.sku,
      'Quantity Sold': item.quantity_sold,
      'Total Revenue': item.total_revenue,
      'Last Sold': format(new Date(item.last_sold_date), 'MMM dd, yyyy'),
    }))

    exportToCSV(exportData, 'sold-items-report')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Sold Items</CardTitle>
          {items.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-center text-gray-500">No sold items found</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Quantity Sold</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                  <TableHead className="text-right">Last Sold</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.item_id}>
                    <TableCell className="font-medium">{item.item_name}</TableCell>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell className="text-right">{item.quantity_sold}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.total_revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {format(new Date(item.last_sold_date), 'MMM dd, yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

