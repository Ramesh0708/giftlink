import { bumpStat, readStats } from '../lib/stats-store.mjs'

export default async (req) => {
  try {
    if (req.method === 'GET') {
      return Response.json(await readStats())
    }
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}))
      if (body.field !== 'visits') {
        return Response.json({ error: 'Unknown field' }, { status: 400 })
      }
      return Response.json(await bumpStat('visits'))
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
