import { importRemoteWishlist } from '../lib/import-wishlist.mjs'

export default async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }
  try {
    const body = await req.json()
    const data = await importRemoteWishlist(body)
    return Response.json(data)
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Could not import that list' },
      { status: 400 },
    )
  }
}

export const config = {
  path: '/api/import-wishlist',
}
