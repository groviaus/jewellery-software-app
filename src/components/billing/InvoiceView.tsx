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
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex justify-end gap-2 print:hidden">
        <Link href="/billing">
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Create Another
          </Button>
        </Link>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <Button variant="outline" onClick={handleDownloadPDF}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>

      <Card className="print:border-none print:shadow-none">
        <CardContent className="p-8">
          {/* Header */}
          <div className="mb-8 border-b pb-4">
            <div className="flex justify-between">
              <div>
                <h1 className="text-2xl font-bold">
                  {settings?.store_name || 'Jewellery Store'}
                </h1>
                {settings?.address && (
                  <p className="mt-1 text-sm text-gray-600">{settings.address}</p>
                )}
                {settings?.gst_number && (
                  <p className="text-sm text-gray-600">GST: {settings.gst_number}</p>
                )}
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold">INVOICE</h2>
                <p className="mt-1 text-sm text-gray-600">
                  {invoice.invoice_number}
                </p>
                <p className="text-sm text-gray-600">
                  Date: {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          {invoice.customer && (
            <div className="mb-6">
              <h3 className="mb-2 font-semibold">Bill To:</h3>
              <p>{invoice.customer.name}</p>
              <p className="text-sm text-gray-600">{invoice.customer.phone}</p>
            </div>
          )}

          {/* Items Table */}
          <div className="mb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Item</th>
                  <th className="p-2 text-left">SKU</th>
                  <th className="p-2 text-right">Weight (g)</th>
                  <th className="p-2 text-right">Qty</th>
                  <th className="p-2 text-right">Price</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">{item.item?.name || 'N/A'}</td>
                    <td className="p-2 text-sm text-gray-600">
                      {item.item?.sku || 'N/A'}
                    </td>
                    <td className="p-2 text-right">{item.weight}</td>
                    <td className="p-2 text-right">{item.quantity}</td>
                    <td className="p-2 text-right">
                      {formatCurrency(item.price)}
                    </td>
                    <td className="p-2 text-right">
                      {formatCurrency(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="ml-auto w-64 space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span>Gold Value:</span>
              <span>{formatCurrency(parseFloat(invoice.gold_value.toString()))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Making Charges:</span>
              <span>
                {formatCurrency(parseFloat(invoice.making_charges.toString()))}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>GST:</span>
              <span>{formatCurrency(parseFloat(invoice.gst_amount.toString()))}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-bold">
              <span>Grand Total:</span>
              <span>{formatCurrency(parseFloat(invoice.total_amount.toString()))}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 border-t pt-4 text-center text-sm text-gray-600">
            <p>Thank you for your business!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

