import {
  amazonAsin,
  amazonImageFallback,
  extractProduct,
  fetchProductPreview,
} from './extract-product.mjs'

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-IN,en;q=0.9',
}

export function detectStore(url) {
  const host = url.toLowerCase()
  if (host.includes('amazon.') || host.includes('amzn.')) return 'amazon'
  if (host.includes('flipkart.')) return 'flipkart'
  return 'other'
}

function decode(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim()
}

function stripTags(value) {
  return decode(String(value || '').replace(/<[^>]+>/g, ' '))
}

function absUrl(href, base) {
  try {
    return new URL(href, base).href
  } catch {
    return href
  }
}

function parsePrice(chunk) {
  const patterns = [
    /data-price="([\d.]+)"/i,
    /a-price-whole[^>]*>([\d,]+)/i,
    /₹\s*([\d,]+)/,
    /Rs\.?\s*([\d,]+)/i,
    /"price"\s*:\s*"?([\d.]+)"?/i,
  ]
  for (const re of patterns) {
    const m = re.exec(chunk)
    if (!m) continue
    const n = Number(String(m[1]).replace(/,/g, ''))
    if (Number.isFinite(n) && n > 0) return n
  }
  return null
}

function isProductUrl(url) {
  const u = url.toLowerCase()
  return (
    /\/(?:dp|gp\/product|gp\/aw\/d)\/[a-z0-9]{10}/i.test(u) ||
    /[?&]asin=[a-z0-9]{10}/i.test(u) ||
    /flipkart\.com\/.+\/p\/itm/i.test(u)
  )
}

function isListUrl(url) {
  let path = url.toLowerCase()
  try {
    path = new URL(url).pathname.toLowerCase()
  } catch {
    /* keep the raw string */
  }
  return (
    path.includes('/hz/wishlist') ||
    path.includes('/gp/registry') ||
    path.includes('/registry/wishlist') ||
    path.includes('/wishlist') ||
    path.includes('/registries') ||
    path.includes('/gp/aw/ls')
  )
}

function looksLikeProductPage(html) {
  return (
    /id=["']productTitle["']/i.test(html) ||
    /id=["']dp-container["']/i.test(html) ||
    /id=["']ppd["']/i.test(html) ||
    /property=["']og:type["'][^>]*content=["'](?:product|product\.item)["']/i.test(html)
  )
}

function wishlistRegion(html) {
  const start = html.search(/id=["'](?:g-items|wl-list-entries|wishlist-page)["']/i)
  if (start === -1) return null
  const rest = html.slice(start)
  const stop = rest.search(
    /Similar items|Inspired by your|Customers who|Recommended for|Sponsored products|id=["']rhf["']/i,
  )
  return stop === -1 ? rest : rest.slice(0, stop)
}

function extractUrls(text) {
  return String(text || '')
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s))
}

function amazonItems(html, pageUrl) {
  const region = wishlistRegion(html)
  const source = region ?? (isListUrl(pageUrl) ? html : '')
  if (!source) return []
  const origin = new URL(pageUrl).origin
  const seen = new Set()
  const items = []

  const push = (asin, href, title, image, price) => {
    if (!asin || seen.has(asin)) return
    const cleanTitle = stripTags(title).slice(0, 160)
    if (!cleanTitle || cleanTitle.length < 3) return
    seen.add(asin)
    items.push({
      key: asin,
      title: cleanTitle,
      url: absUrl(href || `/dp/${asin}`, origin),
      image: image ? absUrl(image, origin) : amazonImageFallback(absUrl(href || `/dp/${asin}`, origin)),
      price,
      store: 'amazon',
    })
  }

  const blockRe = /data-itemid="([^"]+)"/gi
  let block
  while ((block = blockRe.exec(source))) {
    const chunk = source.slice(block.index, block.index + 7000)
    const asinM = chunk.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i)
    if (!asinM) continue
    const hrefM = chunk.match(/href="([^"]*\/(?:dp|gp\/product)\/[A-Z0-9]{10}[^"]*)"/i)
    const title =
      chunk.match(/title="([^"]{4,220})"/i)?.[1] ||
      chunk.match(/<a[^>]*href="[^"]*\/(?:dp|gp\/product)\/[A-Z0-9]{10}[^"]*"[^>]*>([\s\S]*?)<\/a>/i)?.[1] ||
      chunk.match(/<h2[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i)?.[1] ||
      chunk.match(/a-link-normal[^>]*>([\s\S]*?)<\/a>/i)?.[1] ||
      ''
    const image =
      chunk.match(/src="(https:\/\/[^"]*(?:media-amazon|images-amazon)[^"]+)"/i)?.[1] ||
      chunk.match(/data-src="(https:\/\/[^"]*(?:media-amazon|images-amazon)[^"]+)"/i)?.[1] ||
      ''
    push(asinM[1].toUpperCase(), hrefM?.[1], title, image, parsePrice(chunk))
  }

  if (items.length === 0) {
    const linkRe =
      /<a[^>]+href="([^"]*\/(?:dp|gp\/product)\/([A-Z0-9]{10})[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi
    let m
    while ((m = linkRe.exec(source))) {
      const title = stripTags(m[3])
      if (title.length < 8) continue
      push(m[2].toUpperCase(), m[1], title, '', null)
    }
  }

  return items
}

function flipkartItems(html, pageUrl) {
  if (!isListUrl(pageUrl) && isProductUrl(pageUrl)) return []
  const origin = new URL(pageUrl).origin
  const seen = new Set()
  const items = []
  const linkRe = /href="(\/[^"]+\/p\/itm[^"?]*)[^"]*"/gi
  let m
  while ((m = linkRe.exec(html))) {
    const path = m[1].split('?')[0]
    if (seen.has(path)) continue
    seen.add(path)
    const chunk = html.slice(Math.max(0, m.index - 400), m.index + 2500)
    const title =
      chunk.match(/title="([^"]{4,220})"/i)?.[1] ||
      path
        .split('/')
        .filter(Boolean)[0]
        ?.replace(/-/g, ' ') ||
      'Flipkart item'
    const image =
      chunk.match(/src="(https:\/\/[^"]*(?:rukminim|flixcart)[^"]+)"/i)?.[1] || ''
    items.push({
      key: path,
      title: stripTags(title).slice(0, 160),
      url: absUrl(path, origin),
      image,
      price: parsePrice(chunk),
      store: 'flipkart',
    })
  }
  return items
}

function listNameFrom(html, store) {
  const title =
    html.match(/property="og:title"[^>]+content="([^"]+)"/i)?.[1] ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ||
    ''
  const clean = stripTags(title).replace(/\s*[|:].*$/, '').trim()
  if (clean) return clean.slice(0, 80)
  return store === 'flipkart' ? 'Flipkart wishlist' : 'Amazon wishlist'
}

async function fetchPage(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: FETCH_HEADERS,
    signal: AbortSignal.timeout(12000),
  })
  const html = await res.text()
  if (!res.ok && html.length < 200) {
    throw new Error(`Could not open that page (${res.status})`)
  }
  return { html, finalUrl: res.url || url }
}

function itemFromHtml(html, pageUrl) {
  const data = extractProduct(html, pageUrl)
  const store = detectStore(pageUrl)
  const asin = amazonAsin(pageUrl)
  return {
    key: asin || pageUrl,
    title: (data.title || pageUrl).slice(0, 160),
    url: pageUrl,
    image: data.image || amazonImageFallback(pageUrl),
    price: data.price,
    store: store === 'other' ? 'other' : store,
  }
}

function parsePage(html, pageUrl) {
  const store = detectStore(pageUrl)
  const items = store === 'flipkart' ? flipkartItems(html, pageUrl) : amazonItems(html, pageUrl)
  return {
    store: store === 'other' ? detectStore(pageUrl) : store,
    listName: listNameFrom(html, store),
    items: items.slice(0, 80),
  }
}

async function itemFromProductPage(url) {
  const data = await fetchProductPreview(url)
  const store = detectStore(data.url || url)
  const finalUrl = data.url || url
  const asin = amazonAsin(finalUrl)
  return {
    key: asin || finalUrl,
    title: (data.title || finalUrl).slice(0, 160),
    url: finalUrl,
    image: data.image || amazonImageFallback(finalUrl),
    price: data.price,
    store: store === 'other' ? 'other' : store,
  }
}

export function itemsFromPage(html, pageUrl) {
  if (isProductUrl(pageUrl) || (looksLikeProductPage(html) && !isListUrl(pageUrl))) {
    return [itemFromHtml(html, pageUrl)]
  }
  return parsePage(html, pageUrl).items
}

function emptyListError(store) {
  return store === 'flipkart'
    ? 'Flipkart did not share that list (often needs a login). Share the wishlist, or paste product links below.'
    : 'Amazon did not share that list. Open your list → Share → Anyone with the link, then paste that URL. Or paste product links below.'
}

async function loadLink(raw) {
  if (isProductUrl(raw)) {
    const item = await itemFromProductPage(raw)
    return {
      store: item.store,
      listName: item.title,
      sourceUrl: item.url,
      items: [item],
    }
  }

  const store = detectStore(raw)
  if (store !== 'amazon' && store !== 'flipkart') {
    throw new Error('Use an Amazon or Flipkart link.')
  }

  const { html, finalUrl } = await fetchPage(raw)
  const finalStore = detectStore(finalUrl)
  const pageUrl = isListUrl(finalUrl) ? finalUrl : isListUrl(raw) ? raw : finalUrl
  const pageItems = itemsFromPage(html, pageUrl)
  if (
    !isListUrl(pageUrl) &&
    (isProductUrl(finalUrl) || looksLikeProductPage(html)) &&
    pageItems.length > 0
  ) {
    const item = pageItems[0]
    return {
      store: item.store,
      listName: item.title,
      sourceUrl: finalUrl,
      items: [item],
    }
  }

  if (isListUrl(raw) || isListUrl(finalUrl) || wishlistRegion(html)) {
    const parsed = { ...parsePage(html, pageUrl), items: pageItems }
    if (parsed.items.length === 0) throw new Error(emptyListError(finalStore))
    return { ...parsed, sourceUrl: finalUrl }
  }

  throw new Error(
    'That link isn’t a product or a shared wishlist. Paste the product page, or the wishlist’s “Anyone with the link” URL.',
  )
}

export async function importRemoteWishlist({ url, text }) {
  const pasted = extractUrls(text)
  const primary = url?.trim() ? [url.trim()] : []
  const all = []
  const seen = new Set()
  for (const candidate of [...primary, ...pasted]) {
    if (!candidate || seen.has(candidate)) continue
    seen.add(candidate)
    all.push(candidate)
  }
  if (all.length === 0) {
    throw new Error('Paste an Amazon or Flipkart wishlist link, or product links.')
  }

  const items = []
  let listName = ''
  let sourceUrl = all[0]
  let store = detectStore(all[0])

  for (const link of all.slice(0, 25)) {
    const loaded = await loadLink(link)
    if (!listName) listName = loaded.listName
    if (loaded.sourceUrl) sourceUrl = loaded.sourceUrl
    if (loaded.store) store = loaded.store
    for (const item of loaded.items) {
      if (items.some((existing) => existing.key === item.key || existing.url === item.url)) continue
      items.push(item)
    }
  }

  if (items.length === 0) throw new Error(emptyListError(store))

  return {
    store,
    listName: items.length === 1 ? items[0].title : listName || 'Imported products',
    items,
    sourceUrl,
  }
}
