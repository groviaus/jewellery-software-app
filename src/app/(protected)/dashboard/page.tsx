import { requireAuth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { TABLES } from '@/lib/constants'
import StatsCards from '@/components/dashboard/StatsCards'
import RecentSales from '@/components/dashboard/RecentSales'
import SalesTrendChart from '@/components/dashboard/SalesTrendChart'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, ShoppingCart, Package } from 'lucide-react'
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back! Here's your store overview</p>
        </div>
        <div className="flex gap-2">
          <Link href="/inventory/new">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </Link>
          <Link href="/billing">
            <Button>
              <ShoppingCart className="mr-2 h-4 w-4" />
              New Sale
            </Button>
          </Link>
        </div>
      </div>

      <StatsCards todaySales={todaySales} totalStock={totalStock} />

      <SalesTrendChart initialInvoices={recentInvoices || []} />

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentSales invoices={recentInvoices || []} />
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/inventory">
              <Button variant="outline" className="w-full">
                <Package className="mr-2 h-4 w-4" />
                View Inventory
              </Button>
            </Link>
            <Link href="/customers">
              <Button variant="outline" className="w-full">
                View Customers
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="outline" className="w-full">
                View Reports
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" className="w-full">
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
