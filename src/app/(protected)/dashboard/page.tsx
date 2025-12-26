import { requireAuth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { TABLES } from '@/lib/constants'
import CustomizableDashboard from '@/components/dashboard/CustomizableDashboard'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, ShoppingCart } from 'lucide-react'
import { cookies } from 'next/headers'

export default async function DashboardPage() {
  const user = await requireAuth()

  // Create Supabase client with token for data fetching
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

  // Get today's date range
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Get today's invoices
  const { data: todayInvoices } = await supabase
    .from(TABLES.INVOICES)
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString())

  // Get total items count
  const { data: items } = await supabase
    .from(TABLES.ITEMS)
    .select('quantity')
    .eq('user_id', user.id)

  // Get recent invoices
  const { data: recentInvoices, error: recentInvoicesError } = await supabase
    .from(TABLES.INVOICES)
    .select(
      `
      *,
      customer:${TABLES.CUSTOMERS}(name)
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Log for debugging if needed
  if (recentInvoicesError) {
    console.error('Error fetching recent invoices:', recentInvoicesError)
  }

  const todaySales = todayInvoices?.reduce(
    (sum, inv) => sum + parseFloat(inv.total_amount.toString()),
    0
  ) || 0

  const totalStock = items?.reduce((sum, item) => sum + item.quantity, 0) || 0

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-muted-foreground">Welcome back! Here's your store overview</p>
        </div>
        <div className="flex gap-2">
          <Link href="/inventory/new" className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </Link>
          <Link href="/billing" className="flex-1 sm:flex-none">
            <Button className="w-full sm:w-auto">
              <ShoppingCart className="mr-2 h-4 w-4" />
              New Sale
            </Button>
          </Link>
        </div>
      </div>

      <CustomizableDashboard
        todaySales={todaySales}
        totalStock={totalStock}
        recentInvoices={recentInvoices || []}
      />
    </div>
  )
}
