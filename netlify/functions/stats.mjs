import { bumpStat, fieldForEvent, readStats } from '../lib/stats-store.mjs'
import { cleanRef } from '../lib/wishlist-access.mjs'

export default async (req) => {
  try {
    if (req.method === 'GET') {
      return Response.json(await readStats())
    }
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}))
      const field = fieldForEvent(body.event || body.field)
      if (!field) return Response.json({ error: 'Unknown event' }, { status: 400 })
      if (field === 'refSignups') {
        const listId = cleanRef(body.listId)
        const ref = cleanRef(body.ref, listId)
        if (!listId || !ref) return Response.json(await readStats())
        return Response.json(await bumpStat(field, 1, listId))
      }
      const once = field === 'created' ? cleanRef(body.listId) : ''
      return Response.json(await bumpStat(field, 1, once))
    }
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Stats error' },
      { status: 500 },
    )
  }
}

export const config = {
  path: '/api/stats',
}
