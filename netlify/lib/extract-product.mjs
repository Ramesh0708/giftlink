const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-IN,en;q=0.9',
}

function decode(value) {
  return String(value || '')
    .replace(/\\u0026/g, '&')
    .replace(/\\u002F/gi, '/')
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim()
}

function absUrl(href, base) {
  const raw = decode(href).replace(/^\/\//, 'https://')
  if (!raw) return ''
  try {
    return new URL(raw, base).href
  } catch {
    return raw
  }
}

function amazonAsin(url) {
  return (
    url.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i)?.[1] ||
    url.match(/[?&]asin=([A-Z0-9]{10})/i)?.[1] ||
    ''
  ).toUpperCase()
}

function amazonImageFallback(url) {
  const asin = amazonAsin(url)
  if (!asin) return ''
  return `https://m.media-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_SX500_.jpg`
}

function looksLikeProductImage(url) {
  const u = url.toLowerCase()
  if (!u.startsWith('http')) return false
  if (
    /sprite|logo|icon|pixel|1x1|spinner|blank|transparent|favicon|badge/.test(u)
  ) {
    return false
  }
  return (
    /media-amazon|images-amazon|ssl-images-amazon|amazon-adsystem|rukminim|flixcart|myntra|myntassets|\.(jpe?g|png|webp)/i.test(
      u.split('?')[0],
    )
  )
}

function metaContent(html, names) {
  for (const name of names) {
    const re = new RegExp(
      `<meta[^>]*(?:property|name|itemprop)=["']${name}["'][^>]*content=["']([^"']+)["']`,
      'i',
    )
    const re2 = new RegExp(
      `<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name|itemprop)=["']${name}["']`,
      'i',
    )
    const hit = re.exec(html)?.[1] || re2.exec(html)?.[1]
    if (hit) return decode(hit)
  }
  return ''
}

function collectImageCandidates(html, pageUrl) {
  const found = []
  const push = (raw) => {
    if (!raw) return
    const url = absUrl(String(raw).replace(/\\/g, ''), pageUrl)
    if (url && looksLikeProductImage(url)) found.push(url)
  }

  push(metaContent(html, ['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src', 'image']))

  for (const block of html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      const data = JSON.parse(block[1])
      const nodes = Array.isArray(data) ? data : [data, ...(data['@graph'] || [])]
      for (const node of nodes) {
        const img = node?.image
        if (typeof img === 'string') push(img)
        else if (Array.isArray(img)) img.forEach((i) => push(typeof i === 'string' ? i : i?.url))
        else if (img?.url) push(img.url)
      }
    } catch {
      /* ignore broken JSON-LD */
    }
  }

  for (const m of html.matchAll(/data-a-dynamic-image=["']([^"']+)["']/gi)) {
    try {
      const map = JSON.parse(decode(m[1]))
      Object.keys(map).forEach(push)
    } catch {
      /* ignore */
    }
  }

  for (const m of html.matchAll(
    /"(?:hiRes|large|mainUrl|landingImageUrl|imageUrl|smartUrl|url)"\s*:\s*"(https?:[^"]+)"/gi,
  )) {
    push(m[1])
  }

  const landing =
    html.match(/id=["']landingImage["'][^>]*src=["']([^"']+)["']/i)?.[1] ||
    html.match(/data-old-hires=["']([^"']+)["']/i)?.[1]
  push(landing)

  for (const m of html.matchAll(
    /src=["'](https:\/\/[^"']*(?:media-amazon|images-amazon|rukminim|flixcart)[^"']+)["']/gi,
  )) {
    push(m[1])
  }

  push(amazonImageFallback(pageUrl))
  return [...new Set(found)]
}

function parsePrice(html) {
  const patterns = [
    /(?:property|name)=["'](?:product:price:amount|og:price:amount)["'][^>]*content=["']([\d.,]+)/i,
    /content=["']([\d.,]+)["'][^>]*(?:property|name)=["'](?:product:price:amount|og:price:amount)/i,
    /a-price-whole[^>]*>([\d,]+)/i,
    /₹\s*([\d,]+)/,
    /"priceAmount"\s*:\s*"?([\d.]+)"?/i,
    /"price"\s*:\s*"?([\d.]+)"?/i,
  ]
  for (const re of patterns) {
    const m = re.exec(html)
    if (!m) continue
    const n = Number(String(m[1]).replace(/,/g, ''))
    if (Number.isFinite(n) && n > 0) return n
  }
  return null
}

export function extractProduct(html, pageUrl) {
  const title = (
    metaContent(html, ['og:title', 'twitter:title']) ||
    html.match(/id=["']productTitle["'][^>]*>([\s\S]*?)<\/[^>]+>/i)?.[1] ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ||
    ''
  )
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*[|:].{0,40}Amazon.*$/i, '')
    .replace(/\s*[|:].{0,40}Flipkart.*$/i, '')
    .trim()
    .slice(0, 140)

  return {
    title,
    image: collectImageCandidates(html, pageUrl)[0] || '',
    price: parsePrice(html),
  }
}

export async function fetchProductPreview(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: FETCH_HEADERS,
    signal: AbortSignal.timeout(12000),
  })
  const html = await res.text()
  const finalUrl = res.url || url
  const data = extractProduct(html, finalUrl)
  if (!data.image) data.image = amazonImageFallback(finalUrl) || amazonImageFallback(url)
  return { ...data, url: finalUrl }
}

export { amazonAsin, amazonImageFallback }
