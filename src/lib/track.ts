const GA_EVENTS: Record<string, string> = {
  created: 'list_created',
  item: 'item_added',
  published: 'published',
  share: 'share_clicked',
  open: 'list_opened',
  claim: 'claim',
  buy: 'buy_click',
  ref: 'ref_signup',
  add_first: 'add_first_item',
  sample: 'sample_diwali',
}

type Gtag = (...args: unknown[]) => void

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: Gtag
  }
}

export function gaEvent(event: string, extra: Record<string, string> = {}) {
  const name = GA_EVENTS[event]
  if (!name || typeof window.gtag !== 'function') return
  window.gtag('event', name, extra)
}

export function trackPage(path: string) {
  if (typeof window.gtag !== 'function') return
  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: `${window.location.origin}${path}`,
    page_title: document.title,
  })
}

function postStats(event: string, extra: Record<string, string> = {}) {
  const body = JSON.stringify({ event, ...extra })
  try {
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(
        '/api/stats',
        new Blob([body], { type: 'application/json' }),
      )
      if (sent) return Promise.resolve()
    }
  } catch {
    /* fall through to fetch */
  }
  return fetch('/api/stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).then(() => undefined).catch(() => undefined)
}

export function track(event: string, extra: Record<string, string> = {}) {
  gaEvent(event, extra)
  postStats(event, extra)
}

const COUNTED_ITEMS = 'giftlink:counted-items'

export function trackItems(listId: string, itemIds: string[]) {
  let seen: string[] = []
  try {
    const parsed = JSON.parse(sessionStorage.getItem(COUNTED_ITEMS) || '[]') as unknown
    if (Array.isArray(parsed)) seen = parsed.filter((id) => typeof id === 'string')
  } catch {
    seen = []
  }
  const known = new Set(seen)
  const fresh = itemIds.filter((id) => id && !known.has(`${listId}:${id}`))
  if (!fresh.length) return
  try {
    sessionStorage.setItem(
      COUNTED_ITEMS,
      JSON.stringify([...seen, ...fresh.map((id) => `${listId}:${id}`)].slice(-300)),
    )
  } catch {
    /* the beacon still goes out */
  }
  for (const itemId of fresh) gaEvent('item', { listId, itemId })
  return postStats('item', { listId, amount: String(fresh.length) })
}

function deliverStats(event: string, extra: Record<string, string> = {}) {
  return fetch('/api/stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, ...extra }),
    keepalive: true,
  }).then(() => undefined).catch(() => undefined)
}

export async function trackNewList(listId: string, itemIds: string[] = []) {
  gaEvent('created', { listId })
  await deliverStats('created', { listId })
  if (!itemIds.length) return
  for (const itemId of itemIds) gaEvent('item', { listId, itemId })
  try {
    const parsed = JSON.parse(sessionStorage.getItem(COUNTED_ITEMS) || '[]') as unknown
    const seen = Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
    sessionStorage.setItem(
      COUNTED_ITEMS,
      JSON.stringify([...seen, ...itemIds.map((id) => `${listId}:${id}`)].slice(-300)),
    )
  } catch {
    /* still count the items once */
  }
  await deliverStats('item', { listId, amount: String(itemIds.length) })
}
