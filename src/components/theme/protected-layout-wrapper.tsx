'use client'

import { useEffect } from 'react'
import { ThemeSync } from './theme-sync'
import { OfflineBanner } from '@/components/capacitor/OfflineBanner'
import { initializeStatusBar } from '@/lib/capacitor/status-bar'

export function ProtectedLayoutWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeStatusBar()
  }, [])

  return (
    <>
      <ThemeSync />
      <OfflineBanner />
      <div className="safe-area-top">
        {children}
      </div>
    </>
  )
}

