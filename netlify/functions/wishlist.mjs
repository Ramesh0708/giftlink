import { getStore } from '@netlify/blobs'
import { bumpStat } from '../lib/stats-store.mjs'

function publicList(list) {
  const { ownerKey, links, ...rest } = list
  return rest
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function parsePath(url) {
  const { pathname } = new URL(url)
  return pathname.replace(/\/+$/, '').split('/').filter(Boolean)
}

export default async (req) => {
  const parts = parsePath(req.url)
  const id = parts[2]
  const action = parts[3]
  const store = getStore('wishlists')

  try {
    if (req.method === 'GET' && id) {
      const list = await store.get(id, { type: 'json' })
      if (!list) return json(404, { error: 'Wishlist not found' })
      const peek = new URL(req.url).searchParams.has('peek')
      if (!peek) void bumpStat('opens')
      return json(200, { list: publicList(list) })
    }

    if (req.method === 'PUT' && id) {
      const incoming = await req.json()
      const existing = await store.get(id, { type: 'json' })
      const ownerKey = req.headers.get('x-owner-key') || ''
      if (existing && existing.ownerKey !== ownerKey) {
        return json(403, { error: 'Wrong edit key' })
      }
      if (!existing) void bumpStat('lists')
      const incomingItems = Array.isArray(incoming.items) ? incoming.items : []
      const items = incomingItems.map((item) => {
        const prev = existing?.items?.find((i) => i.id === item.id)
        return { ...item, reservedBy: prev?.reservedBy ?? item.reservedBy ?? null }
      })
      const list = {
        id,
        ownerKey: existing?.ownerKey || ownerKey || crypto.randomUUID(),
        recipient: typeof incoming.recipient === 'string' ? incoming.recipient : existing?.recipient || '',
        occasion: typeof incoming.occasion === 'string' ? incoming.occasion : existing?.occasion || 'Birthday',
        message: typeof incoming.message === 'string' ? incoming.message : existing?.message || '',
        updatedAt: new Date().toISOString(),
        items,
        links: Array.isArray(incoming.links) ? incoming.links : existing?.links,
      }
      await store.setJSON(id, list)
      return json(200, { list: publicList(list) })
    }

    if (req.method === 'POST' && id && (action === 'reserve' || action === 'unreserve')) {
      const list = await store.get(id, { type: 'json' })
      if (!list) return json(404, { error: 'Wishlist not found' })
      const body = await req.json()
      const item = list.items.find((i) => i.id === body.itemId)
      if (!item) return json(404, { error: 'Item not found' })
      const name = String(body.name || '').trim()
      if (action === 'reserve') {
        if (item.reservedBy) return json(409, { error: 'Already reserved' })
        if (!name) return json(400, { error: 'Name required' })
        item.reservedBy = name
      } else {
        if (item.reservedBy && item.reservedBy !== name) {
          return json(403, { error: 'Only the person who reserved it can undo' })
        }
        item.reservedBy = null
      }
      list.updatedAt = new Date().toISOString()
      await store.setJSON(id, list)
      return json(200, { list: publicList(list) })
    }

    return json(404, { error: 'Not found' })
  } catch (err) {
    return json(500, { error: err instanceof Error ? err.message : 'Server error' })
  }
}

export const config = {
  path: ['/api/wishlists', '/api/wishlists/*'],
}
