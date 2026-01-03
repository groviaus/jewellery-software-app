import { requireAuth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { TABLES } from '@/lib/constants'
import { notFound } from 'next/navigation'
import InvoiceView from '@/components/billing/InvoiceView'
import { cookies } from 'next/headers'

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireAuth()

  const cookieStore = await cookies()
  const token = cookieStore.get('sb-access-token')?.value

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  )

  // Get invoice with customer
  const { data: invoice, error: invoiceError } = await supabase
    .from(TABLES.INVOICES)
    .select(
      `
      *,
      customer:${TABLES.CUSTOMERS}(name, phone)
    `
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (invoiceError || !invoice) {
    notFound()
  }

  // Get invoice items with item details
  const { data: invoiceItems } = await supabase
    .from(TABLES.INVOICE_ITEMS)
    .select(
      `
      *,
      item:${TABLES.ITEMS}(name, sku, metal_type, purity)
    `
    )
    .eq('invoice_id', id)

  // Get store settings
  const { data: settings } = await supabase
    .from(TABLES.STORE_SETTINGS)
    .select('*')
    .eq('user_id', user.id)
    .single()

  const invoiceData = {
    ...invoice,
    items: invoiceItems || [],
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold px-2 sm:px-0">Invoice Details</h1>

      <InvoiceView invoice={invoiceData} settings={settings} />
    </div>
  )
}

