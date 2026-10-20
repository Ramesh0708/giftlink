import { fetchProductPreview, PreviewError } from '../lib/extract-product.mjs'

export default async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  try {
    const { url } = await req.json()
    if (!url) return Response.json({ error: 'Missing url' }, { status: 400 })
    return Response.json(await fetchProductPreview(url))
  } catch (err) {
    const status = err instanceof PreviewError ? err.status : 500
    return Response.json(
      { error: err instanceof Error ? err.message : 'Could not read that link' },
      { status },
    )
  }
}

export const config = {
  path: '/api/preview',
}
