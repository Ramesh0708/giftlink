export function track(event: string, extra: Record<string, string> = {}) {
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
