import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

type Item = {
  id: string
  title: string
  url: string
  image: string
  price: number | null
  currency: 'INR' | 'USD'
  store: string
  notes: string
  priority: string
  reservedBy: string | null
}

type List = {
  id: string
  ownerKey: string
  recipient: string
  occasion: string
  message: string
  updatedAt: string
  items: Item[]
  links?: { store: string; url: string; name: string; linkedAt: string }[]
}

function statsPath() {
  return path.resolve('.data/stats.json')
}

function dbPath() {
  return path.resolve('.data/wishlists.json')
}

function loadStats() {
  try {
    return JSON.parse(fs.readFileSync(statsPath(), 'utf8')) as {
      visits: number
      lists: number
      opens: number
    }
  } catch {
    return { visits: 0, lists: 0, opens: 0 }
  }
}

function saveStats(stats: { visits: number; lists: number; opens: number }) {
  fs.mkdirSync(path.dirname(statsPath()), { recursive: true })
  fs.writeFileSync(statsPath(), JSON.stringify(stats, null, 2))
}

function bumpLocal(field: 'visits' | 'lists' | 'opens') {
  const stats = loadStats()
  stats[field] += 1
  saveStats(stats)
  return stats
}

function loadDb(): Record<string, List> {
  try {
    return JSON.parse(fs.readFileSync(dbPath(), 'utf8')) as Record<string, List>
  } catch {
    return {}
  }
}

function saveDb(db: Record<string, List>) {
  fs.mkdirSync(path.dirname(dbPath()), { recursive: true })
  fs.writeFileSync(dbPath(), JSON.stringify(db, null, 2))
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(Buffer.from(c)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function matchApi(url: string) {
  const u = new URL(url, 'http://localhost')
  const parts = u.pathname.replace(/\/+$/, '').split('/').filter(Boolean)
  return { parts, url: u }
}

async function preview(url: string) {
  const { fetchProductPreview } = await import('./netlify/lib/extract-product.mjs')
  return fetchProductPreview(url)
}

function wishlistApi(): Plugin {
  const handle = async (req: IncomingMessage, res: ServerResponse) => {
    if (req.url?.startsWith('/api/og/')) {
      const { parts } = matchApi(req.url)
      const id = decodeURIComponent(parts[2] || '')
      const list = id ? loadDb()[id] : null
      if (!list) {
        res.statusCode = 404
        res.end('Not found')
        return true
      }
      const { renderShareImage } = await import('./netlify/lib/og-card.mjs')
      const png = await renderShareImage(list)
      res.statusCode = 200
      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Cache-Control', 'public, max-age=300')
      res.end(png)
      return true
    }
    if (req.url?.startsWith('/s/')) {
      const { parts } = matchApi(req.url)
      const id = parts[1] || ''
      const origin = `http://${req.headers.host || 'localhost:5173'}`
      const list = id ? loadDb()[id] : null
      const { shareCardHtml } = await import('./netlify/lib/share-card.mjs')
      const card = shareCardHtml({ origin, id, list })
      res.statusCode = card.status
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', card.status === 200 ? 'public, max-age=300' : 'no-store')
      res.end(card.html)
      return true
    }
    if (!req.url?.startsWith('/api/')) return false
    const { parts, url } = matchApi(req.url)
    try {
      if (req.method === 'GET' && parts[0] === 'api' && parts[1] === 'stats') {
        send(res, 200, loadStats())
        return true
      }
      if (req.method === 'POST' && parts[0] === 'api' && parts[1] === 'stats') {
        send(res, 200, bumpLocal('visits'))
        return true
      }
      if (req.method === 'POST' && parts[0] === 'api' && parts[1] === 'preview') {
        const body = JSON.parse((await readBody(req)) || '{}') as { url?: string }
        if (!body.url) {
          send(res, 400, { error: 'Missing url' })
          return true
        }
        try {
          send(res, 200, await preview(body.url))
        } catch (err) {
          const status =
            err && typeof err === 'object' && 'status' in err ? Number(err.status) || 500 : 500
          send(res, status, {
            error: err instanceof Error ? err.message : 'Could not read that link',
          })
        }
        return true
      }

      if (req.method === 'POST' && parts[0] === 'api' && parts[1] === 'import-wishlist') {
        const body = JSON.parse((await readBody(req)) || '{}') as {
          url?: string
          text?: string
        }
        const { importRemoteWishlist } = await import('./netlify/lib/import-wishlist.mjs')
        try {
          send(res, 200, await importRemoteWishlist(body))
        } catch (err) {
          send(res, 400, {
            error: err instanceof Error ? err.message : 'Could not import that list',
          })
        }
        return true
      }

      if (parts[0] !== 'api' || parts[1] !== 'wishlists') {
        send(res, 404, { error: 'Not found' })
        return true
      }

      const db = loadDb()
      const id = parts[2]
      const action = parts[3]
      const ownerKey = String(req.headers['x-owner-key'] || '')
      const access = await import('./netlify/lib/wishlist-access.mjs')

      if (req.method === 'GET' && id) {
        const list = db[id]
        if (!list) {
          send(res, 404, { error: 'Wishlist not found' })
          return true
        }
        if (ownerKey) {
          if (ownerKey !== list.ownerKey) {
            send(res, 403, { error: 'Wrong edit key' })
            return true
          }
          send(res, 200, { list: access.presentList(list, { owner: true }), owner: true })
          return true
        }
        if (!url.searchParams.has('peek')) bumpLocal('opens')
        const tokens = access.tokensFromHeader(req.headers['x-claim-tokens'])
        send(res, 200, { list: access.presentList(list, { tokens }) })
        return true
      }

      if (req.method === 'PUT' && id) {
        const incoming = JSON.parse((await readBody(req)) || '{}') as List
        const existing = db[id]
        if (existing && existing.ownerKey !== ownerKey) {
          send(res, 403, { error: 'Wrong edit key' })
          return true
        }
        if (!existing) bumpLocal('lists')
        const items = access.mergeItems(
          existing?.items,
          Array.isArray(incoming.items) ? incoming.items : [],
        )
        const list: List = {
          id,
          ownerKey: existing?.ownerKey || ownerKey || crypto.randomUUID(),
          recipient: typeof incoming.recipient === 'string' ? incoming.recipient : existing?.recipient || '',
          occasion: typeof incoming.occasion === 'string' ? incoming.occasion : existing?.occasion || 'Birthday',
          message: typeof incoming.message === 'string' ? incoming.message : existing?.message || '',
          updatedAt: new Date().toISOString(),
          items,
          links: Array.isArray(incoming.links) ? incoming.links : existing?.links,
        }
        db[id] = list
        saveDb(db)
        const owner = Boolean(ownerKey) && ownerKey === list.ownerKey
        send(res, 200, { list: access.presentList(list, { owner }), owner })
        return true
      }

      if (req.method === 'POST' && id && (action === 'reserve' || action === 'unreserve')) {
        const list = db[id]
        if (!list) {
          send(res, 404, { error: 'Wishlist not found' })
          return true
        }
        const body = JSON.parse((await readBody(req)) || '{}') as {
          itemId?: string
          name?: string
          token?: string
          tokens?: string[]
        }
        const tokens = access.tokensFromHeader(
          [req.headers['x-claim-tokens'], ...(body.tokens || [])].filter(Boolean).join(','),
        )
        if (action === 'reserve') {
          const claimToken = access.reserve(list, body)
          tokens.add(claimToken)
          saveDb(db)
          send(res, 200, {
            list: access.presentList(list, { tokens }),
            claimToken,
            itemId: body.itemId,
          })
          return true
        }
        access.unreserve(list, body)
        saveDb(db)
        send(res, 200, { list: access.presentList(list, { tokens }) })
        return true
      }

      send(res, 404, { error: 'Not found' })
    } catch (err) {
      const status = err && typeof err === 'object' && 'status' in err ? Number(err.status) || 500 : 500
      send(res, status, { error: err instanceof Error ? err.message : 'Server error' })
    }
    return true
  }

  return {
    name: 'giftlink-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        void handle(req, res).then((hit) => {
          if (!hit) next()
        })
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        void handle(req, res).then((hit) => {
          if (!hit) next()
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), wishlistApi()],
})
