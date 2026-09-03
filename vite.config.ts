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
}

function dbPath() {
  return path.resolve('.data/wishlists.json')
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

function publicList(list: List) {
  const { ownerKey: _ownerKey, ...rest } = list
  return rest
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
  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: 'text/html',
    },
  })
  const html = await res.text()
  const pick = (prop: string) => {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
      'i',
    )
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,
      'i',
    )
    return re.exec(html)?.[1] || re2.exec(html)?.[1] || ''
  }
  const title =
    pick('og:title') ||
    /<title[^>]*>([^<]+)<\/title>/i.exec(html)?.[1]?.trim() ||
    ''
  const image = pick('og:image') || pick('twitter:image')
  const priceRaw =
    pick('product:price:amount') ||
    pick('og:price:amount') ||
    /"price"\s*:\s*"?([\d.]+)"?/i.exec(html)?.[1] ||
    ''
  const price = priceRaw ? Number(priceRaw.replace(/[^\d.]/g, '')) : null
  return {
    title: title.replace(/\s+/g, ' ').slice(0, 140),
    image,
    price: price && Number.isFinite(price) ? price : null,
  }
}

function wishlistApi(): Plugin {
  const handle = async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url?.startsWith('/api/')) return false
    const { parts } = matchApi(req.url)
    try {
      if (req.method === 'POST' && parts[0] === 'api' && parts[1] === 'preview') {
        const body = JSON.parse((await readBody(req)) || '{}') as { url?: string }
        if (!body.url) {
          send(res, 400, { error: 'Missing url' })
          return true
        }
        send(res, 200, await preview(body.url))
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

      if (req.method === 'GET' && id) {
        const list = db[id]
        if (!list) {
          send(res, 404, { error: 'Wishlist not found' })
          return true
        }
        send(res, 200, { list: publicList(list) })
        return true
      }

      if (req.method === 'PUT' && id) {
        const incoming = JSON.parse((await readBody(req)) || '{}') as List
        const existing = db[id]
        if (existing && existing.ownerKey !== ownerKey) {
          send(res, 403, { error: 'Wrong edit key' })
          return true
        }
        const incomingItems = Array.isArray(incoming.items) ? incoming.items : []
        const items = incomingItems.map((item) => {
          const prev = existing?.items.find((i) => i.id === item.id)
          return { ...item, reservedBy: prev?.reservedBy ?? item.reservedBy ?? null }
        })
        const list: List = {
          id,
          ownerKey: existing?.ownerKey || ownerKey || crypto.randomUUID(),
          recipient: incoming.recipient || 'Someone',
          occasion: incoming.occasion || 'Birthday',
          message: incoming.message || '',
          updatedAt: new Date().toISOString(),
          items,
        }
        db[id] = list
        saveDb(db)
        send(res, 200, { list: publicList(list) })
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
        }
        const item = list.items.find((i) => i.id === body.itemId)
        if (!item) {
          send(res, 404, { error: 'Item not found' })
          return true
        }
        const name = (body.name || '').trim()
        if (action === 'reserve') {
          if (item.reservedBy) {
            send(res, 409, { error: 'Already reserved' })
            return true
          }
          if (!name) {
            send(res, 400, { error: 'Name required' })
            return true
          }
          item.reservedBy = name
        } else {
          if (item.reservedBy && item.reservedBy !== name) {
            send(res, 403, { error: 'Only the person who reserved it can undo' })
            return true
          }
          item.reservedBy = null
        }
        list.updatedAt = new Date().toISOString()
        saveDb(db)
        send(res, 200, { list: publicList(list) })
        return true
      }

      send(res, 404, { error: 'Not found' })
    } catch (err) {
      send(res, 500, { error: err instanceof Error ? err.message : 'Server error' })
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
