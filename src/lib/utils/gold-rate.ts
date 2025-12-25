/**
 * Gold rate management utilities
 * Handles localStorage for gold rate history
 */

const GOLD_RATE_STORAGE_KEY = 'jewellery_gold_rate_history'
const MAX_HISTORY = 5

export interface GoldRateHistory {
  rate: number
  timestamp: string
}

export function getGoldRateHistory(): GoldRateHistory[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(GOLD_RATE_STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function saveGoldRate(rate: number): void {
  if (typeof window === 'undefined') return
  
  try {
    const history = getGoldRateHistory()
    const newEntry: GoldRateHistory = {
      rate,
      timestamp: new Date().toISOString(),
    }
    
    // Add to beginning and keep only last MAX_HISTORY entries
    const updated = [newEntry, ...history.filter(h => h.rate !== rate)].slice(0, MAX_HISTORY)
    localStorage.setItem(GOLD_RATE_STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // Ignore errors
  }
}

export function getLastGoldRate(): number | null {
  const history = getGoldRateHistory()
  return history.length > 0 ? history[0].rate : null
}

