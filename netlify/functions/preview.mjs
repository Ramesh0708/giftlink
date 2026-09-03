function pick(html, prop) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
    'i',
  )
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,
    'i',
  )
  return decode(re.exec(html)?.[1] || re2.exec(html)?.[1] || '')
}

function decode(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { url } = await req.json()
    if (!url) {
      return Response.json({ error: 'Missing url' }, { status: 400 })
    }
    const res = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html',
      },
    })
    const html = await res.text()
    const title =
      pick(html, 'og:title') ||
      /<title[^>]*>([^<]+)<\/title>/i.exec(html)?.[1]?.trim() ||
      ''
    const image = pick(html, 'og:image') || pick(html, 'twitter:image')
    const priceRaw =
      pick(html, 'product:price:amount') ||
      pick(html, 'og:price:amount') ||
      /"price"\s*:\s*"?([\d.]+)"?/i.exec(html)?.[1] ||
      ''
    const price = priceRaw ? Number(String(priceRaw).replace(/[^\d.]/g, '')) : null
    return Response.json({
      title: title.replace(/\s+/g, ' ').slice(0, 140),
      image,
      price: price && Number.isFinite(price) ? price : null,
    })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Could not read that link' },
      { status: 500 },
    )
  }
}

export const config = {
  path: '/api/preview',
}
