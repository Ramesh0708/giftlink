export const MANUAL_FILL = "Couldn't fetch this product. Fill it in manually."

const DESKTOP_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-IN,en;q=0.9,en;q=0.8',
  'Cache-Control': 'no-cache',
  'Upgrade-Insecure-Requests': '1',
}

const MOBILE_HEADERS = {
  ...DESKTOP_HEADERS,
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
}

const JUNK_TITLE = [
  /^amazon(?:\.[a-z]{2,3})?(?:\.[a-z]{2})?$/i,
  /^flipkart(?:\.com)?$/i,
  /^www\.[a-z0-9.-]+\.[a-z]{2,}$/i,
  /^[a-z0-9.-]+\.(?:com|in|net|org)$/i,
  /online shopping india/i,
  /buy mobiles, electronics/i,
  /service unavailable/i,
  /page not found/i,
  /robot check/i,
  /sorry[,!]?\s+something went wrong/i,
  /access denied/i,
  /^document moved/i,
  /^attention required/i,
  /^just a moment/i,
  /^503\b/,
  /^502\b/,
  /^404\b/,
  /captcha/i,
  /conditions of use/i,
  /^welcome to amazon/i,
  /^error\b/i,
  /^amazon(?:\.[a-z]{2,3}){1,2}\s*[:|-]/i,
  /^for you$/i,
  /^home$/i,
  /^online shopping$/i,
  /^shop now$/i,
]

export class PreviewError extends Error {
  constructor(message, status = 422) {
    super(message)
    this.name = 'PreviewError'
    this.status = status
  }
}

function decode(value) {
  return String(value || '')
    .replace(/\\u0026/g, '&')
    .replace(/\\u002F/gi, '/')
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
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

export function amazonAsin(url) {
  return (
    String(url || '').match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i)?.[1] ||
    String(url || '').match(/[?&]asin=([A-Z0-9]{10})/i)?.[1] ||
    ''
  ).toUpperCase()
}

export function amazonImageFallback(url) {
  const asin = amazonAsin(url)
  if (!asin) return ''
  return `https://m.media-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_SX500_.jpg`
}

export function isJunkImage(url) {
  const u = String(url || '').toLowerCase()
  if (!u.startsWith('http')) return true
  return /sprite|logo|icon|pixel|1x1|spinner|blank|transparent|favicon|badge|nav-sprite|orange-arrow|\/promos\/|flipkart-plus|fk-p-flap|\/flap\/|banner|placeholder|swatch|tracking|uedata/.test(
    u,
  )
}

export function isJunkTitle(title) {
  const t = String(title || '').replace(/\s+/g, ' ').trim()
  if (t.length < 3) return true
  return JUNK_TITLE.some((re) => re.test(t))
}

export function isUsableProduct(data) {
  return Boolean(data?.title) && !isJunkTitle(data.title)
}

function cleanTitle(value) {
  return decode(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(
      /\s*[|\-–—:]\s*(?:Amazon(?:\.[a-z]{2,3})?(?:\.[a-z]{2})?|Flipkart(?:\.com)?)\s*$/i,
      '',
    )
    .replace(/\s+price in india.*$/i, '')
    .trim()
    .slice(0, 140)
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

function asNumber(value) {
  if (value == null || value === '') return null
  const n = Number(String(value).replace(/,/g, '').trim())
  if (!Number.isFinite(n) || n < 1 || n >= 10_000_000) return null
  return Math.round(n)
}

function priceFromOffers(offers) {
  const list = Array.isArray(offers) ? offers : offers ? [offers] : []
  for (const offer of list) {
    if (!offer || typeof offer !== 'object') continue
    const amount = asNumber(offer.price ?? offer.lowPrice ?? offer.highPrice)
    if (amount) return amount
  }
  return null
}

function collectProducts(node, out) {
  if (!node) return
  if (Array.isArray(node)) {
    node.forEach((entry) => collectProducts(entry, out))
    return
  }
  if (typeof node !== 'object') return
  if (node['@graph']) collectProducts(node['@graph'], out)
  const type = node['@type']
  const types = (Array.isArray(type) ? type : type ? [type] : []).map((item) => String(item))
  if (types.some((item) => /product/i.test(item)) || (node.name && node.offers)) out.push(node)
}

function readJsonLd(html) {
  const products = []
  for (const block of html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      collectProducts(JSON.parse(block[1]), products)
    } catch {
      /* ignore broken JSON-LD */
    }
  }
  return products
}

function pushImage(found, raw, pageUrl) {
  if (!raw) return
  const url = absUrl(String(raw).replace(/\\/g, ''), pageUrl)
  if (url && !isJunkImage(url)) found.push(upgradeAmazonImage(url))
}

export function upgradeAmazonImage(url) {
  const match = String(url || '').match(
    /^(https:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9+-]+)(?:\.[^/?#]+)?/,
  )
  if (!match) return url
  return `${match[1]}._SL500_.jpg`
}

function collectImageCandidates(html, pageUrl, products) {
  const found = []
  for (const product of products) {
    const img = product.image
    if (typeof img === 'string') pushImage(found, img, pageUrl)
    else if (Array.isArray(img)) {
      img.forEach((item) => pushImage(found, typeof item === 'string' ? item : item?.url, pageUrl))
    } else if (img?.url) pushImage(found, img.url, pageUrl)
  }

  pushImage(
    found,
    metaContent(html, ['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src']),
    pageUrl,
  )

  for (const match of html.matchAll(/data-a-dynamic-image=["']([^"']+)["']/gi)) {
    try {
      Object.keys(JSON.parse(decode(match[1]))).forEach((url) => pushImage(found, url, pageUrl))
    } catch {
      /* ignore */
    }
  }

  for (const match of html.matchAll(
    /"(?:hiRes|large|mainUrl|landingImageUrl)"\s*:\s*"(https?:[^"]+)"/gi,
  )) {
    pushImage(found, match[1], pageUrl)
  }

  const landing =
    html.match(/id=["']landingImage["'][^>]*src=["']([^"']+)["']/i)?.[1] ||
    html.match(/data-old-hires=["']([^"']+)["']/i)?.[1]
  pushImage(found, landing, pageUrl)

  for (const match of html.matchAll(
    /src=["'](https:\/\/[^"']*(?:media-amazon|images-amazon|rukminim|rukmini|flixcart)[^"']+)["']/gi,
  )) {
    pushImage(found, match[1], pageUrl)
  }

  return [...new Set(found)]
}

function loosePrice(html) {
  const re =
    /(?:₹|Rs\.?|INR|\$|€|£)\s*([\d]{1,3}(?:[,\s]\d{2,3})+|\d{2,7})(?:\.\d{1,2})?/g
  let match
  while ((match = re.exec(html))) {
    const ctx = html.slice(Math.max(0, match.index - 48), match.index).toLowerCase()
    if (
      /under|over|above|option|delivery|orders|search-alias|minimum|free shipping|more than|worth|refund|deduct/.test(
        ctx,
      )
    ) {
      continue
    }
    const amount = asNumber(match[1].replace(/[\s]/g, ''))
    if (amount) return amount
  }
  return null
}

function amazonOffscreenPrice(html) {
  const re = /class=["'][^"']*a-offscreen[^"']*["'][^>]*>\s*([^<]{1,40})/gi
  let match
  while ((match = re.exec(html))) {
    if (/m\.r\.p|list price/i.test(match[1])) continue
    if (!/(?:₹|Rs\.?|\$|€|£)\s*[\d]/.test(match[1])) continue
    const ctx = html.slice(Math.max(0, match.index - 120), match.index).toLowerCase()
    if (/m\.r\.p|list price|was price|typical price|under\s*$|search-alias/.test(ctx)) continue
    const amount = asNumber(match[1].replace(/[^\d.]/g, ''))
    if (amount) return amount
  }
  return null
}

function amazonWidgetPrice(html) {
  const chunks = []
  for (const id of [
    'corePrice_feature_div',
    'corePriceDisplay_desktop_feature_div',
    'apex_desktop',
    'apex_offerDisplay_desktop',
    'priceToPay',
  ]) {
    const idx = html.search(new RegExp(`id=["']${id}["']`, 'i'))
    if (idx >= 0) chunks.push(html.slice(idx, idx + 12000))
  }
  const scoped = chunks.join('\n')
  if (!scoped) return null
  const offscreen = scoped.match(
    /class=["'][^"']*a-offscreen[^"']*["'][^>]*>\s*(?:₹|Rs\.?|INR|\$|€|£)?\s*([\d,]+(?:\.\d+)?)/i,
  )
  if (offscreen) {
    const amount = asNumber(offscreen[1])
    if (amount) return amount
  }
  const whole = scoped.match(/a-price-whole[^>]*>\s*([\d,]+)/i)
  if (whole) return asNumber(whole[1])
  const amount = scoped.match(/"priceAmount"\s*:\s*"?([\d.]+)"?/i)
  if (amount) return asNumber(amount[1])
  return null
}

function parsePrice(html, products, pageUrl) {
  for (const product of products) {
    const amount = priceFromOffers(product.offers)
    if (amount) return amount
  }
  const meta = asNumber(
    metaContent(html, ['product:price:amount', 'og:price:amount']),
  )
  if (meta) return meta
  const widget = amazonWidgetPrice(html)
  if (widget) return widget
  if (/\/(?:dp|gp\/product|gp\/aw\/d)\/[A-Z0-9]{10}/i.test(pageUrl)) {
    const offscreen = amazonOffscreenPrice(html)
    if (offscreen) return offscreen
  }
  const titleAt = html.search(/id=["']productTitle["']/i)
  if (titleAt >= 0) return loosePrice(html.slice(titleAt, titleAt + 30000))
  return null
}

function firstGoodTitle(candidates) {
  const cleaned = candidates.map((value) => cleanTitle(value)).filter(Boolean)
  return cleaned.find((title) => !isJunkTitle(title)) || cleaned[0] || ''
}

export function extractProduct(html, pageUrl) {
  const source = String(html || '')
  const products = readJsonLd(source)
  const title = firstGoodTitle([
    ...products.map((product) => product.name),
    source.match(/id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i)?.[1],
    metaContent(source, ['og:title', 'twitter:title']),
    source.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1],
    source.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1],
  ])

  return {
    title,
    image: collectImageCandidates(source, pageUrl, products)[0] || '',
    price: parsePrice(source, products, pageUrl),
  }
}

function assertPublicUrl(raw) {
  let url
  try {
    url = new URL(String(raw || '').trim())
  } catch {
    throw new PreviewError('That link is not a product URL.', 400)
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new PreviewError('That link is not a product URL.', 400)
  }
  const host = url.hostname.toLowerCase()
  if (
    host === 'localhost' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host === '0.0.0.0' ||
    /^(127\.|10\.|192\.168\.|169\.254\.)/.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  ) {
    throw new PreviewError('That link is not a product URL.', 400)
  }
  return url
}

function isAmazonHost(url) {
  return /amazon\.|amzn\./i.test(url.hostname)
}

function isFlipkartProduct(url) {
  return url.hostname.includes('flipkart.') && /\/p\/itm/i.test(url.pathname)
}

function amazonDesktopUrl(url) {
  const asin = amazonAsin(url.href)
  if (!asin) return url.href
  return `${url.origin}/dp/${asin}`
}

function amazonMobileUrl(url) {
  const asin = amazonAsin(url.href)
  if (!asin) return ''
  return `${url.origin}/gp/aw/d/${asin}`
}

function isStoreHome(url) {
  try {
    const page = new URL(url)
    const home = page.pathname === '/' || page.pathname === ''
    return home && /amazon\.|flipkart\.|amzn\./i.test(page.hostname)
  } catch {
    return false
  }
}

async function fetchHtml(target, headers) {
  const res = await fetch(target, {
    redirect: 'follow',
    headers,
    signal: AbortSignal.timeout(7000),
  })
  const html = await res.text()
  const finalUrl = res.url || target
  if (isStoreHome(finalUrl)) return { title: '', image: '', price: null, url: finalUrl }
  return { ...extractProduct(html, finalUrl), url: finalUrl }
}

function productFromSchema(node) {
  if (!node || typeof node !== 'object') return null
  const title = cleanTitle(node.name)
  const images = []
  const img = node.image
  if (typeof img === 'string') images.push(img)
  else if (Array.isArray(img)) {
    img.forEach((item) => {
      if (typeof item === 'string') images.push(item)
      else if (item?.url) images.push(item.url)
    })
  }
  return {
    title,
    image: images.find((item) => item && !isJunkImage(item)) || '',
    price: priceFromOffers(node.offers),
  }
}

const FLIPKART_ROME = [
  'https://1.rome.api.flipkart.com/api/4/page/fetch',
  'https://2.rome.api.flipkart.com/api/4/page/fetch',
]

const FLIPKART_MOBILE_UA =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36'

const FLIPKART_DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export function flipkartTitleFromUrl(rawUrl) {
  let url
  try {
    url = new URL(String(rawUrl || ''))
  } catch {
    return ''
  }
  if (!isFlipkartProduct(url)) return ''
  const slug =
    decodeURIComponent(url.pathname.split('/p/')[0] || '')
      .split('/')
      .filter(Boolean)
      .pop() || ''
  const words = slug.split(/[-_]+/).filter((word) => word && !/^itm/i.test(word))
  const title = words
    .map((word, index) => {
      const lower = word.toLowerCase()
      if (index > 0 && /^(and|or|for|the|a|an|of|to|in|on|with|from)$/.test(lower)) return lower
      const unit = lower.match(/^(\d+)([a-z]+)$/)
      if (unit) return `${unit[1]}${unit[2].toUpperCase()}`
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
  const pid = url.searchParams.get('pid') || url.pathname.match(/\/(itm[a-z0-9]+)/i)?.[1] || ''
  if (!title && !pid) return ''
  if (!title) return `Flipkart item ${pid}`
  return pid ? `${title} (${pid})` : title
}

function upgradeFlipkartImage(url) {
  return String(url || '').replace(/(\/image\/)\d+\/\d+\//, '$1800/800/')
}

function flipkartSlug(url) {
  return (
    decodeURIComponent(String(url.pathname || '').split('/p/')[0] || '')
      .split('/')
      .filter(Boolean)
      .pop() || ''
  )
}

export function flipkartCardsFromHtml(html) {
  const cards = []
  const re = /href="([^"]*\/p\/(itm[a-z0-9]+)[^"]*)"[\s\S]{0,14000}?<\/a>/gi
  for (const match of String(html || '').matchAll(re)) {
    const chunk = match[0]
    const href = decode(match[1])
    const title = cleanTitle(chunk.match(/\balt="([^"]+)"/i)?.[1] || '')
    const image = upgradeFlipkartImage(chunk.match(/\bsrc="(https:\/\/rukmini[^"]+)"/i)?.[1] || '')
    const price = asNumber(chunk.match(/₹\s*([\d,]+)/)?.[1])
    if (!title || isJunkTitle(title)) continue
    const pid = href.match(/[?&]pid=([A-Za-z0-9]+)/)?.[1] || ''
    cards.push({ href, itm: match[2].toLowerCase(), pid: pid.toUpperCase(), title, image, price })
  }
  return cards
}

export function flipkartCardForUrl(html, rawUrl) {
  let url
  try {
    url = new URL(String(rawUrl || ''))
  } catch {
    return null
  }
  const cards = flipkartCardsFromHtml(html)
  const itm = url.pathname.match(/\/(itm[a-z0-9]+)/i)?.[1]?.toLowerCase() || ''
  const pid = (url.searchParams.get('pid') || '').toUpperCase()
  const slug = flipkartSlug(url).toLowerCase()
  return (
    cards.find((card) => itm && card.itm === itm) ||
    cards.find((card) => pid && card.pid === pid) ||
    cards.find((card) => slug && card.href.toLowerCase().includes(`/${slug}/p/`)) ||
    null
  )
}

export function productFromRome(data, pageUrl) {
  const schema = data?.RESPONSE?.pageData?.seoData?.schema
  const nodes = Array.isArray(schema) ? schema : schema ? [schema] : []
  let best = null
  for (const node of nodes) {
    const product = productFromSchema(node)
    if (!isUsableProduct(product)) continue
    if (product.image) product.image = upgradeFlipkartImage(product.image)
    if (!best || (product.price && !best.price) || (product.image && !best.image)) best = product
    if (product.price && product.image) {
      best = product
      break
    }
  }
  if (best && best.price == null) {
    const final = JSON.stringify(data).match(/"finalPrice":([0-9.]+)/)
    if (final) best = { ...best, price: asNumber(final[1]) }
  }
  if (!best) return null
  return { ...best, url: pageUrl }
}

async function requestRome(endpoint, pageUri, pageUrl) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: '*/*',
        'User-Agent': FLIPKART_MOBILE_UA,
        'X-User-Agent': `${FLIPKART_MOBILE_UA} FKUA/msite/0.0.3/msite/Mobile`,
        Origin: 'https://www.flipkart.com',
        Referer: 'https://www.flipkart.com/',
      },
      body: JSON.stringify({
        pageUri,
        pageContext: { fetchSeoData: true },
      }),
      signal: AbortSignal.timeout(5000),
    })
    if (res.status === 429 || res.status === 503) {
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 350))
        continue
      }
      return null
    }
    if (!res.ok) return null
    try {
      return productFromRome(await res.json(), pageUrl)
    } catch {
      return null
    }
  }
  return null
}

async function fetchFlipkartSearch(url) {
  const slug = flipkartSlug(url)
  if (!slug) return null
  const query = slug.replace(/[-_]+/g, ' ')
  const res = await fetch(`https://www.flipkart.com/search?q=${encodeURIComponent(query)}`, {
    redirect: 'follow',
    headers: {
      ...DESKTOP_HEADERS,
      'User-Agent': FLIPKART_DESKTOP_UA,
    },
    signal: AbortSignal.timeout(7000),
  })
  if (!res.ok) return null
  const card = flipkartCardForUrl(await res.text(), url.href)
  if (!card) return null
  return {
    title: card.title,
    image: card.image && !isJunkImage(card.image) ? card.image : '',
    price: card.price,
    url: url.href,
  }
}

function raceUsable(tasks) {
  return new Promise((resolve) => {
    let pending = tasks.length
    let best = null
    let done = false
    const finish = (value) => {
      if (done) return
      done = true
      resolve(value)
    }
    if (!pending) {
      finish(null)
      return
    }
    for (const task of tasks) {
      Promise.resolve(task)
        .then((value) => {
          if (done || !isUsableProduct(value)) return
          best = mergeProduct(best, value)
          if (best?.price != null && best.image) finish(best)
        })
        .catch(() => {})
        .finally(() => {
          pending -= 1
          if (!done && pending === 0) finish(best)
        })
    }
  })
}

async function fetchFlipkartApi(url) {
  const pageUri = `${url.pathname}${url.search}`
  const mobile = new URL(url.href)
  mobile.hostname = mobile.hostname.replace(/^www\./, '')
  if (!mobile.hostname.startsWith('m.')) mobile.hostname = `m.${mobile.hostname}`
  return raceUsable([
    ...FLIPKART_ROME.map((endpoint) => requestRome(endpoint, pageUri, url.href)),
    fetchFlipkartSearch(url),
    fetchHtml(url.href, { ...MOBILE_HEADERS, 'User-Agent': FLIPKART_MOBILE_UA }),
    fetchHtml(mobile.href, { ...MOBILE_HEADERS, 'User-Agent': FLIPKART_MOBILE_UA }),
  ])
}

function readerPrice(markdown) {
  return loosePrice(markdown)
}

function readerImages(markdown) {
  const found = []
  for (const match of markdown.matchAll(/https:\/\/[^\s)"']+/g)) {
    const url = match[0].replace(/\\+$/, '')
    if (isJunkImage(url) || /community-reviews|_SS\d|_SX3\d|_SY50_|sprites/i.test(url)) continue
    if (/media-amazon\.com\/images\/I\//i.test(url) || /rukmini|rukminim|flixcart\.com\/image/i.test(url)) {
      pushImage(found, url, url)
    }
  }
  return found[0] || ''
}

async function fetchReader(url) {
  const res = await fetch(`https://r.jina.ai/${url.href}`, {
    headers: {
      Accept: 'text/plain',
      'User-Agent': DESKTOP_HEADERS['User-Agent'],
    },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return null
  const markdown = (await res.text()).slice(0, 180000)
  const title = cleanTitle(markdown.match(/^Title:\s*(.+)$/m)?.[1] || '')
  return {
    title,
    image: readerImages(markdown),
    price: readerPrice(markdown),
    url: url.href,
  }
}

async function settle(task) {
  try {
    return await task
  } catch (err) {
    if (err instanceof PreviewError) throw err
    return null
  }
}

function mergeProduct(primary, extra) {
  if (!isUsableProduct(primary)) return extra
  if (!isUsableProduct(extra)) return primary
  return {
    title: primary.title || extra.title,
    image: primary.image || extra.image || '',
    price: primary.price ?? extra.price ?? null,
    url: primary.url || extra.url,
  }
}

async function firstUsable(tasks) {
  const results = await Promise.allSettled(tasks)
  let best = null
  for (const result of results) {
    if (result.status !== 'fulfilled' || !result.value) continue
    if (!isUsableProduct(result.value)) continue
    best = mergeProduct(best, result.value)
    if (best?.price != null && best.image) return best
  }
  return best
}

export async function fetchProductPreview(rawUrl) {
  const url = assertPublicUrl(rawUrl)
  if (isStoreHome(url.href)) throw new PreviewError(MANUAL_FILL, 422)
  let data = null

  if (isFlipkartProduct(url)) {
    data = await settle(fetchFlipkartApi(url))
    if (!isUsableProduct(data)) {
      const title = flipkartTitleFromUrl(url.href)
      if (title) data = { title, image: '', price: null, url: url.href }
    }
  } else if (!isUsableProduct(data) || data?.price == null || !data?.image) {
    const tasks = []
    if (isAmazonHost(url) && amazonAsin(url.href)) {
      tasks.push(fetchHtml(amazonDesktopUrl(url), DESKTOP_HEADERS))
      const mobile = amazonMobileUrl(url)
      if (mobile) tasks.push(fetchHtml(mobile, MOBILE_HEADERS))
    } else {
      tasks.push(fetchHtml(url.href, DESKTOP_HEADERS))
    }
    if (tasks.length) data = mergeProduct(data, await firstUsable(tasks))
    if (!isUsableProduct(data)) data = await settle(fetchReader(url))
  }

  if (!isUsableProduct(data)) throw new PreviewError(MANUAL_FILL, 422)

  let image = data.image || ''
  if (!image) image = amazonImageFallback(data.url || url.href)
  if (image && isJunkImage(image)) image = ''

  return {
    title: data.title,
    image,
    price: data.price ?? null,
    url: data.url || url.href,
  }
}
