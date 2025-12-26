import { requireAuth } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { TABLES } from '@/lib/constants'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import CustomerTable from '@/components/customers/CustomerTable'
import { cookies } from 'next/headers'

export default async function CustomersPage() {
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

  const { data: customers, error } = await supabase
    .from(TABLES.CUSTOMERS)
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Customers</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Manage your customer database</p>
        </div>
        <Link href="/customers/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </Link>
      </div>
      <div className="mt-6 sm:mt-8">
        {error ? (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive">
            <p>Error loading customers: {error.message}</p>
          </div>
        ) : (
          <CustomerTable customers={customers || []} />
        )}
      </div>
    </div>
  )
}

