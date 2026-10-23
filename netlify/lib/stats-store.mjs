import { getStore } from '@netlify/blobs'

export const EMPTY_STATS = {
  visits: 0,
  lists: 0,
  opens: 0,
  created: 0,
  items: 0,
  published: 0,
  shares: 0,
  claims: 0,
  buyClicks: 0,
  refSignups: 0,
  addFirst: 0,
  sampleDiwali: 0,
}

const EVENT_FIELDS = {
  visit: 'visits',
  visits: 'visits',
  created: 'created',
  item: 'items',
  items: 'items',
  published: 'published',
  share: 'shares',
  shares: 'shares',
  open: 'opens',
  opens: 'opens',
  claim: 'claims',
  claims: 'claims',
  buy: 'buyClicks',
  buyClicks: 'buyClicks',
  ref: 'refSignups',
  refSignups: 'refSignups',
  add_first: 'addFirst',
  sample: 'sampleDiwali',
}

export function fieldForEvent(event) {
  return EVENT_FIELDS[String(event || '')] || ''
}

export function normalizeStats(raw) {
  const stats = { ...EMPTY_STATS }
  if (!raw || typeof raw !== 'object') return stats
  for (const key of Object.keys(EMPTY_STATS)) {
    const value = Number(raw[key])
    if (Number.isFinite(value) && value >= 0) stats[key] = Math.round(value)
  }
  return stats
}

export async function readStats() {
  const store = getStore('stats')
  return normalizeStats(await store.get('global', { type: 'json' }))
}

export async function bumpStat(field, amount = 1, onceKey = '') {
  if (!Object.hasOwn(EMPTY_STATS, field)) {
    throw new Error('Unknown field')
  }
  const store = getStore('stats')
  if (onceKey) {
    const key = `once:${field}:${onceKey}`
    if (await store.get(key)) return readStats()
    await store.set(key, '1')
  }
  const stats = await readStats()
  stats[field] = (stats[field] || 0) + amount
  await store.setJSON('global', stats)
  return stats
}
