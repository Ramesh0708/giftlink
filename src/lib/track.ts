const GA_EVENTS: Record<string, string> = {
  created: 'list_created',
  item: 'item_added',
  published: 'published',
  share: 'share_clicked',
  open: 'list_opened',
  claim: 'claim',
  buy: 'buy_click',
  ref: 'ref_signup',
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

export function track(event: string, extra: Record<string, string> = {}) {
  gaEvent(event, extra)
  const body = JSON.stringify({ event, ...extra })
  try {
    if (navigator.sendBeacon) {
      const sent = navigator.sendBeacon(
        '/api/stats',
        new Blob([body], { type: 'application/json' }),
      )
      if (sent) return
    }
  } catch {
    /* fall through to fetch */
  }
  void fetch('/api/stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {})
}
