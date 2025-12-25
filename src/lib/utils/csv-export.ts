/**
 * CSV export utilities
 */

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: string[]
) {
  if (data.length === 0) {
    return
  }

  // Get headers from data if not provided
  const csvHeaders = headers || Object.keys(data[0])

  // Create CSV content
  const csvRows: string[] = []

  // Add header row
  csvRows.push(csvHeaders.map((h) => `"${h}"`).join(','))

  // Add data rows
  data.forEach((row) => {
    const values = csvHeaders.map((header) => {
      const value = row[header]
      // Handle null/undefined
      if (value == null) return '""'
      // Escape quotes and wrap in quotes
      return `"${String(value).replace(/"/g, '""')}"`
    })
    csvRows.push(values.join(','))
  })

  // Create blob and download
  const csvContent = csvRows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

