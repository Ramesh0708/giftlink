import { getStore } from '@netlify/blobs'
import { shareCardHtml } from '../lib/share-card.mjs'

export default async (req) => {
  const url = new URL(req.url)
  const id = url.pathname.split('/').filter(Boolean)[1] || ''
  const origin = url.origin
  try {
    const store = getStore('wishlists')
    const list = id ? await store.get(id, { type: 'json' }) : null
    const html = shareCardHtml({ origin, id, list })
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch {
    const html = shareCardHtml({ origin, id, list: null })
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
}

export const config = {
  path: '/s/:id',
}
