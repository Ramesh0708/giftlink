import { getStore } from '@netlify/blobs'
import { shareCardHtml } from '../lib/share-card.mjs'

export default async (req) => {
  const url = new URL(req.url)
  const id = url.pathname.split('/').filter(Boolean)[1] || ''
  const origin = url.origin
  try {
    const store = getStore('wishlists')
    const list = id ? await store.get(id, { type: 'json' }) : null
    const card = shareCardHtml({ origin, id, list })
    return new Response(card.html, {
      status: card.status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': card.status === 200 ? 'public, max-age=300' : 'no-store',
      },
    })
  } catch {
    return new Response('Wishlist preview is temporarily unavailable', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
}

export const config = {
  path: '/s/:id',
}
