import { useEffect } from 'react'

export function useKeyboardShortcut(
  key: string,
  callback: (event: KeyboardEvent) => void,
  options?: {
    ctrl?: boolean
    shift?: boolean
    alt?: boolean
    meta?: boolean
  }
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const ctrlMatch = options?.ctrl ? event.ctrlKey : !event.ctrlKey
      const shiftMatch = options?.shift ? event.shiftKey : !event.shiftKey
      const altMatch = options?.alt ? event.altKey : !event.altKey
      const metaMatch = options?.meta ? event.metaKey : !event.metaKey

      if (
        event.key === key &&
        ctrlMatch &&
        shiftMatch &&
        altMatch &&
        metaMatch
      ) {
        callback(event)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [key, callback, options])
}

