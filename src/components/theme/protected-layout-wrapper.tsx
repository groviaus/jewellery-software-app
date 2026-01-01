'use client'

import { ThemeSync } from './theme-sync'
import { OfflineBanner } from '@/components/capacitor/OfflineBanner'

export function ProtectedLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeSync />
      <OfflineBanner />
      {children}
    </>
  )
}

