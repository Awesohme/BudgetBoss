// Month utility functions

export const getCurrentMonth = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  return `${year}-${month}`
}

export const formatMonth = (month: string): string => {
  const [year, monthNum] = month.split('-')
  const date = new Date(parseInt(year), parseInt(monthNum) - 1)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

export const getMonthOptions = (currentMonth: string): string[] => {
  const options: string[] = []
  const [currentYear, currentMonthNum] = currentMonth.split('-').map(Number)
  
  // Add 6 months before and after current month
  for (let i = -6; i <= 6; i++) {
    const date = new Date(currentYear, currentMonthNum - 1 + i, 1)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    options.push(`${year}-${month}`)
  }
  
  return options
}

export const getPreviousMonth = (month: string): string => {
  const [year, monthNum] = month.split('-').map(Number)
  const date = new Date(year, monthNum - 2, 1) // monthNum - 2 because month is 0-indexed
  const newYear = date.getFullYear()
  const newMonth = (date.getMonth() + 1).toString().padStart(2, '0')
  return `${newYear}-${newMonth}`
}

export const getNextMonth = (month: string): string => {
  const [year, monthNum] = month.split('-').map(Number)
  const date = new Date(year, monthNum, 1) // monthNum because we want next month
  const newYear = date.getFullYear()
  const newMonth = (date.getMonth() + 1).toString().padStart(2, '0')
  return `${newYear}-${newMonth}`
}

export const formatCurrency = (amount: number, currency = 'NGN'): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-NG').format(value)
}

export const parseFormattedNumber = (value: string): number => {
  // Remove all non-digit and non-decimal characters
  const cleanValue = value.replace(/[^\d.]/g, '')
  return parseFloat(cleanValue) || 0
}

export const formatSmartCurrency = (amount: number, compact = false): string => {
  if (compact) {
    // For compact display in small spaces
    if (amount >= 1000000) {
      return `₦${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `₦${(amount / 1000).toFixed(1)}K`
    }
  }
  
  return formatCurrency(amount)
}

export const getAmountTextSize = (amount: number): string => {
  const formatted = formatCurrency(amount)
  
  if (formatted.length > 12) return 'text-sm font-bold' // Very long amounts
  if (formatted.length > 9) return 'text-base font-bold'   // Long amounts
  return 'text-xl font-bold'  // Normal amounts
}