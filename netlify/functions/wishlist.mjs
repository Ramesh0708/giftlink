import { getStore } from '@netlify/blobs'
import { bumpStat } from '../lib/stats-store.mjs'
import {
  HttpError,
  mergeItems,
  presentList,
  reserve,
  tokensFromHeader,
  unreserve,
} from '../lib/wishlist-access.mjs'

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

function claimTokens(req, body) {
  const tokens = tokensFromHeader(req.headers.get('x-claim-tokens'))
  if (Array.isArray(body?.tokens)) {
    for (const token of tokensFromHeader(body.tokens.join(','))) tokens.add(token)
  }
  return tokens
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
      const ownerKey = req.headers.get('x-owner-key') || ''
      if (ownerKey) {
        if (ownerKey !== list.ownerKey) return json(403, { error: 'Wrong edit key' })
        return json(200, { list: presentList(list, { owner: true }), owner: true })
      }
      const peek = new URL(req.url).searchParams.has('peek')
      if (!peek) void bumpStat('opens')
      return json(200, { list: presentList(list, { tokens: claimTokens(req) }) })
    }

    if (req.method === 'PUT' && id) {
      const incoming = await req.json()
      const existing = await store.get(id, { type: 'json' })
      const ownerKey = req.headers.get('x-owner-key') || ''
      if (existing && existing.ownerKey !== ownerKey) {
        return json(403, { error: 'Wrong edit key' })
      }
      if (!existing) void bumpStat('lists')
      const items = mergeItems(existing?.items, Array.isArray(incoming.items) ? incoming.items : [])
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
      const owner = Boolean(ownerKey) && ownerKey === list.ownerKey
      return json(200, { list: presentList(list, { owner }), owner })
    }

    if (req.method === 'POST' && id && (action === 'reserve' || action === 'unreserve')) {
      const list = await store.get(id, { type: 'json' })
      if (!list) return json(404, { error: 'Wishlist not found' })
      const body = await req.json()
      const tokens = claimTokens(req, body)
      if (action === 'reserve') {
        const claimToken = reserve(list, body)
        tokens.add(claimToken)
        await store.setJSON(id, list)
        return json(200, {
          list: presentList(list, { tokens }),
          claimToken,
          itemId: body.itemId,
        })
      }
      unreserve(list, body)
      await store.setJSON(id, list)
      return json(200, { list: presentList(list, { tokens }) })
    }

    return json(404, { error: 'Not found' })
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500
    return json(status, { error: err instanceof Error ? err.message : 'Server error' })
  }
}

export const config = {
  path: ['/api/wishlists', '/api/wishlists/*'],
}
