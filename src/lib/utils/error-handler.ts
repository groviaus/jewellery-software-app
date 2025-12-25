/**
 * Centralized error handling utilities
 */

export interface AppError {
  message: string
  code?: string
  statusCode?: number
}

export function handleError(error: unknown): AppError {
  if (error instanceof Error) {
    return {
      message: error.message,
    }
  }

  if (typeof error === 'string') {
    return {
      message: error,
    }
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return {
      message: String(error.message),
      code: 'code' in error ? String(error.code) : undefined,
      statusCode: 'statusCode' in error ? Number(error.statusCode) : undefined,
    }
  }

  return {
    message: 'An unexpected error occurred',
  }
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch')
    )
  }
  return false
}

export function getErrorMessage(error: unknown): string {
  const appError = handleError(error)
  return appError.message
}

