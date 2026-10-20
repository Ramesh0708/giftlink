export const DEFAULT_AMAZON_ASSOCIATE_TAG = 'giftlink0e-21'

export function amazonAssociateTag(env = process.env, netlify = globalThis.Netlify) {
  const fromNetlify = netlify?.env?.get?.('AMAZON_ASSOCIATE_TAG')
  const raw = String(fromNetlify ?? env?.AMAZON_ASSOCIATE_TAG ?? '').trim()
  if (!raw || !/^[A-Za-z0-9-]{2,40}$/.test(raw)) return DEFAULT_AMAZON_ASSOCIATE_TAG
  return raw
}

export function amazonAffiliateUrl(rawUrl, tag) {
  if (!tag) return rawUrl || ''
  try {
    const url = new URL(rawUrl)
    const host = url.hostname.toLowerCase()
    if (host !== 'amazon.in' && !host.endsWith('.amazon.in')) return rawUrl
    if (url.searchParams.get('tag')) return url.toString()
    url.searchParams.set('tag', tag)
    return url.toString()
  } catch {
    return rawUrl || ''
  }
}

export function tagAmazonLinks(list, tag) {
  if (!tag || !list?.items) return list
  return {
    ...list,
    items: list.items.map((item) => ({
      ...item,
      url: amazonAffiliateUrl(item.url, tag),
    })),
  }
}
