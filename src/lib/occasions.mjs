const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const DIWALI = { year: 2026, month: 11, day: 8 }
export const DIWALI_LAST_DAY = { year: 2026, month: 11, day: 9 }
export const BANNER_LEAD_DAYS = 21

const ZONE = {
  india: 'Asia/Kolkata',
  americas: 'America/New_York',
  emea: 'Europe/London',
  apac: 'Asia/Singapore',
}

const INDIA_BODY =
  "Amazon's Great Indian Festival deals run till Diwali. Make your list now so family can grab your gifts at sale price — not guess at the last minute."

export function civilDate(now = new Date(), timeZone = 'UTC') {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(now)
  const value = (type) => Number(parts.find((part) => part.type === type)?.value)
  return { year: value('year'), month: value('month'), day: value('day') }
}

export function compareDates(a, b) {
  if (a.year !== b.year) return a.year - b.year
  if (a.month !== b.month) return a.month - b.month
  return a.day - b.day
}

export function daysBetween(from, to) {
  const start = Date.UTC(from.year, from.month - 1, from.day)
  const end = Date.UTC(to.year, to.month - 1, to.day)
  return Math.round((end - start) / 86400000)
}

export function addDays(date, days) {
  const next = new Date(Date.UTC(date.year, date.month - 1, date.day + days))
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1, day: next.getUTCDate() }
}

export function nthWeekday(year, month, weekday, n) {
  const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const day = 1 + ((weekday - first + 7) % 7) + (n - 1) * 7
  return { year, month, day }
}

export function blackFriday(year) {
  return addDays(nthWeekday(year, 11, 4, 4), 1)
}

export function shortDate(date) {
  return `${date.day} ${MONTHS[date.month - 1]}`
}

export function awayPhrase(name, dateLabel, days) {
  if (days > 21) {
    const weeks = Math.round(days / 7)
    return `${name} is ${dateLabel} — ${weeks} weeks away.`
  }
  if (days === 21) return `${name} is ${dateLabel} — 3 weeks away.`
  if (days >= 15) return `${name} is ${dateLabel} — less than 3 weeks away.`
  if (days === 14) return `${name} is ${dateLabel} — 2 weeks away.`
  if (days >= 8) return `${name} is ${dateLabel} — less than 2 weeks away.`
  if (days === 7) return `${name} is ${dateLabel} — a week away.`
  if (days >= 2) return `${name} is ${dateLabel} — ${days} days away.`
  if (days === 1) return `${name} is tomorrow.`
  if (days === 0) return `${name} is today.`
  return `${name} was yesterday.`
}

function inLead(days) {
  return days >= 0 && days <= BANNER_LEAD_DAYS
}

function indiaBanner(today) {
  if (compareDates(today, DIWALI_LAST_DAY) > 0) return null
  const days = daysBetween(today, DIWALI)
  return {
    lead: awayPhrase('Diwali', '8 Nov', days),
    body: INDIA_BODY,
    cta: 'Make a Diwali list',
  }
}

function blackFridayBanner(region, today) {
  const friday = blackFriday(today.year)
  const days = daysBetween(today, friday)
  if (!inLead(days)) return null
  const shops =
    region === 'emea'
      ? 'Amazon, John Lewis, or Zalando'
      : 'Amazon, Target, or Walmart'
  return {
    lead: awayPhrase('Black Friday', shortDate(friday), days),
    body: `Add the gifts you actually want so people can buy them on ${shops} — instead of guessing.`,
    cta: region === 'emea' ? 'Start a Christmas list' : 'Start a holiday list',
  }
}

function christmasBanner(region, today) {
  const christmas = { year: today.year, month: 12, day: 25 }
  const days = daysBetween(today, christmas)
  if (!inLead(days)) return null
  const shops =
    region === 'emea'
      ? 'Amazon, John Lewis, or Zalando'
      : 'Amazon, Target, or Walmart'
  return {
    lead: awayPhrase('Christmas', '25 Dec', days),
    body: `Add gifts from ${shops}, or any shop that delivers to the buyer, before Christmas Day.`,
    cta: region === 'emea' ? 'Start a Christmas list' : 'Start a holiday list',
  }
}

function singlesDayBanner(today) {
  const singles = { year: today.year, month: 11, day: 11 }
  const days = daysBetween(today, singles)
  if (!inLead(days)) return null
  return {
    lead: awayPhrase('11.11', '11 Nov', days),
    body: 'Add gifts from Shopee, Lazada, or Amazon before 11 November so the group buys what you want.',
    cta: 'Start a year-end list',
  }
}

export function occasionBanner(region, now = new Date()) {
  const zone = ZONE[region]
  if (!zone) return null
  const today = civilDate(now, zone)
  if (region === 'india') return indiaBanner(today)
  if (region === 'apac') return singlesDayBanner(today)
  return blackFridayBanner(region, today) || christmasBanner(region, today)
}
