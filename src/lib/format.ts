import type { Currency } from '../types'

const LOCALE: Record<Currency, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'en-IE',
  GBP: 'en-GB',
  AUD: 'en-AU',
  CAD: 'en-CA',
  SGD: 'en-SG',
  AED: 'en-AE',
  JPY: 'ja-JP',
}

export const CURRENCIES: { id: Currency; label: string }[] = [
  { id: 'INR', label: 'INR ₹' },
  { id: 'USD', label: 'USD $' },
  { id: 'EUR', label: 'EUR €' },
  { id: 'GBP', label: 'GBP £' },
  { id: 'AUD', label: 'AUD A$' },
  { id: 'CAD', label: 'CAD C$' },
  { id: 'SGD', label: 'SGD S$' },
  { id: 'AED', label: 'AED' },
  { id: 'JPY', label: 'JPY ¥' },
]

export function money(amount: number | null, currency: Currency = 'INR') {
  if (amount == null || Number.isNaN(amount)) return ''
  return new Intl.NumberFormat(LOCALE[currency] ?? 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

const HOST_CURRENCY: [string, Currency][] = [
  ['amazon.co.uk', 'GBP'],
  ['amazon.de', 'EUR'],
  ['amazon.fr', 'EUR'],
  ['amazon.it', 'EUR'],
  ['amazon.es', 'EUR'],
  ['amazon.nl', 'EUR'],
  ['amazon.com.au', 'AUD'],
  ['amazon.ca', 'CAD'],
  ['amazon.sg', 'SGD'],
  ['amazon.ae', 'AED'],
  ['amazon.co.jp', 'JPY'],
  ['amazon.in', 'INR'],
  ['amazon.com', 'USD'],
  ['flipkart.', 'INR'],
  ['myntra.', 'INR'],
  ['ajio.', 'INR'],
  ['nykaa.', 'INR'],
  ['meesho.', 'INR'],
  ['croma.', 'INR'],
  ['target.com', 'USD'],
  ['walmart.', 'USD'],
  ['bestbuy.', 'USD'],
  ['johnlewis.', 'GBP'],
  ['argos.', 'GBP'],
  ['zalando.', 'EUR'],
  ['rakuten.co.jp', 'JPY'],
  ['shopee.sg', 'SGD'],
  ['lazada.sg', 'SGD'],
]

export function currencyFromUrl(url: string, fallback: Currency): Currency {
  const host = url.toLowerCase()
  for (const [needle, currency] of HOST_CURRENCY) {
    if (host.includes(needle)) return currency
  }
  return fallback
}
