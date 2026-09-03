export function money(amount: number | null, currency: 'INR' | 'USD' = 'INR') {
  if (amount == null || Number.isNaN(amount)) return ''
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}
