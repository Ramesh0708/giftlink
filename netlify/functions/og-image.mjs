import { getStore } from '@netlify/blobs'
import { renderShareImage } from '../lib/og-card.mjs'

export default async (req) => {
  const id = new URL(req.url).pathname.split('/').filter(Boolean).pop() || ''
  try {
    const store = getStore('wishlists')
    const list = id ? await store.get(decodeURIComponent(id), { type: 'json' }) : null
    if (!list) return new Response('Not found', { status: 404 })
    const png = await renderShareImage(list)
    return new Response(png, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch {
    return new Response('Preview image unavailable', { status: 500 })
  }
}

export const config = {
  path: '/api/og/:id',
}
