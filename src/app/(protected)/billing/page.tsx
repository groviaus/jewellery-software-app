'use client'

import POSScreen from '@/components/billing/POSScreen'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'

export default function BillingPage() {

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Point of Sale</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Create invoices and process sales</p>
        </div>
        <Link href="/billing/invoices">
          <Button variant="outline" className="w-full sm:w-auto">
            <FileText className="mr-2 h-4 w-4" />
            View All Invoices
          </Button>
        </Link>
      </div>
      <div className="mt-6 sm:mt-8">
        <POSScreen />
      </div>
    </div>
  )
}

