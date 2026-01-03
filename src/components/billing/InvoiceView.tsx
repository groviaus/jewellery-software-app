'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Download, Printer, Plus } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils/calculations'
import { format } from 'date-fns'
import type { Invoice } from '@/lib/types/billing'
import type { StoreSettings } from '@/lib/types/settings'
import { toast } from '@/lib/utils/toast'

interface InvoiceViewProps {
  invoice: Invoice & {
    items: Array<{
      id: string
      quantity: number
      weight: number
      price: number
      item?: {
        name: string
        sku: string
        metal_type: string
        purity: string
      }
    }>
    customer?: {
      name: string
      phone: string
    }
  }
  settings?: StoreSettings | null
}

export default function InvoiceView({ invoice, settings }: InvoiceViewProps) {
  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/billing/invoice/${invoice.id}/pdf`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${invoice.invoice_number}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('PDF downloaded successfully', invoice.invoice_number)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Failed to download PDF', 'Please try again.')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="mx-auto max-w-4xl px-2 sm:px-4">
      <div className="mb-4 flex flex-wrap gap-2 print:hidden">
        <Link href="/billing" className="flex-1 sm:flex-none">
          <Button variant="outline" className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Create Another</span>
            <span className="sm:hidden">New</span>
          </Button>
        </Link>
        <Button variant="outline" onClick={handlePrint} className="flex-1 sm:flex-none">
          <Printer className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Print</span>
          <span className="sm:hidden">Print</span>
        </Button>
        <Button variant="outline" onClick={handleDownloadPDF} className="flex-1 sm:flex-none">
          <Download className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Download PDF</span>
          <span className="sm:hidden">PDF</span>
        </Button>
      </div>

      <Card className="print:border-none print:shadow-none">
        <CardContent className="p-4 sm:p-6 md:p-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8 border-b pb-4">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold break-words">
                  {settings?.store_name || 'Jewellery Store'}
                </h1>
                {settings?.address && (
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground break-words">{settings.address}</p>
                )}
                {settings?.gst_number && (
                  <p className="text-xs sm:text-sm text-muted-foreground break-words">GST: {settings.gst_number}</p>
                )}
              </div>
              <div className="sm:text-right">
                <h2 className="text-lg sm:text-xl font-bold">INVOICE</h2>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground break-words">
                  {invoice.invoice_number}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Date: {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          {invoice.customer && (
            <div className="mb-6">
              <h3 className="mb-2 text-sm sm:text-base font-semibold">Bill To:</h3>
              <p className="text-sm sm:text-base break-words">{invoice.customer.name}</p>
              <p className="text-xs sm:text-sm text-muted-foreground break-words">{invoice.customer.phone}</p>
            </div>
          )}

          {/* Items Table */}
          <div className="mb-6 overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left text-xs sm:text-sm font-medium">Item</th>
                    <th className="p-2 text-left text-xs sm:text-sm font-medium hidden sm:table-cell">SKU</th>
                    <th className="p-2 text-right text-xs sm:text-sm font-medium">Weight</th>
                    <th className="p-2 text-right text-xs sm:text-sm font-medium">Qty</th>
                    <th className="p-2 text-right text-xs sm:text-sm font-medium hidden md:table-cell">Price</th>
                    <th className="p-2 text-right text-xs sm:text-sm font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-2 text-xs sm:text-sm">
                        <div className="max-w-[120px] sm:max-w-none">
                          <div className="font-medium break-words">{item.item?.name || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground sm:hidden break-words">
                            {item.item?.sku || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="p-2 text-xs sm:text-sm text-muted-foreground hidden sm:table-cell">
                        {item.item?.sku || 'N/A'}
                      </td>
                      <td className="p-2 text-right text-xs sm:text-sm whitespace-nowrap">{item.weight}g</td>
                      <td className="p-2 text-right text-xs sm:text-sm">{item.quantity}</td>
                      <td className="p-2 text-right text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="p-2 text-right text-xs sm:text-sm font-medium whitespace-nowrap">
                        {formatCurrency(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="ml-auto w-full sm:w-64 space-y-2 border-t pt-4">
            <div className="flex justify-between text-xs sm:text-sm">
              <span>Gold Value:</span>
              <span className="font-medium">{formatCurrency(parseFloat(invoice.gold_value.toString()))}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span>Making Charges:</span>
              <span className="font-medium">
                {formatCurrency(parseFloat(invoice.making_charges.toString()))}
              </span>
            </div>

            {/* Show subtotal if there's a discount */}
            {invoice.discount_value && invoice.discount_value > 0 && (
              <>
                <div className="flex justify-between text-xs sm:text-sm font-medium">
                  <span>Subtotal:</span>
                  <span>
                    {formatCurrency(
                      parseFloat(invoice.gold_value.toString()) +
                      parseFloat(invoice.making_charges.toString())
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm text-green-600 dark:text-green-400">
                  <span>
                    Discount {invoice.discount_type === 'percentage' ? `(${invoice.discount_value}%)` : ''}:
                  </span>
                  <span>
                    - {formatCurrency(
                      invoice.discount_type === 'percentage'
                        ? ((parseFloat(invoice.gold_value.toString()) + parseFloat(invoice.making_charges.toString())) * invoice.discount_value) / 100
                        : invoice.discount_value
                    )}
                  </span>
                </div>
              </>
            )}

            <div className="flex justify-between text-xs sm:text-sm">
              <span>GST:</span>
              <span className="font-medium">{formatCurrency(parseFloat(invoice.gst_amount.toString()))}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-sm sm:text-base font-bold">
              <span>Grand Total:</span>
              <span>{formatCurrency(parseFloat(invoice.total_amount.toString()))}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 sm:mt-8 border-t pt-4 text-center text-xs sm:text-sm text-muted-foreground">
            <p>Thank you for your business!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
