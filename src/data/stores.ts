import type { StoreId } from '../types'

export const STORES: {
  id: StoreId
  name: string
  host: string[]
  hue: string
}[] = [
  { id: 'amazon', name: 'Amazon', host: ['amazon.', 'amzn.'], hue: '#ff9900' },
  { id: 'flipkart', name: 'Flipkart', host: ['flipkart.'], hue: '#2874f0' },
  { id: 'myntra', name: 'Myntra', host: ['myntra.'], hue: '#ee5f73' },
  { id: 'ajio', name: 'Ajio', host: ['ajio.'], hue: '#2c4152' },
  { id: 'nykaa', name: 'Nykaa', host: ['nykaa.'], hue: '#fc2779' },
  { id: 'meesho', name: 'Meesho', host: ['meesho.'], hue: '#f43397' },
  { id: 'croma', name: 'Croma', host: ['croma.'], hue: '#1ba672' },
  { id: 'target', name: 'Target', host: ['target.com'], hue: '#cc0000' },
  { id: 'walmart', name: 'Walmart', host: ['walmart.com'], hue: '#0071ce' },
  { id: 'bestbuy', name: 'Best Buy', host: ['bestbuy.'], hue: '#0046be' },
  { id: 'etsy', name: 'Etsy', host: ['etsy.com'], hue: '#f1641e' },
  { id: 'ebay', name: 'eBay', host: ['ebay.'], hue: '#e53238' },
  { id: 'johnlewis', name: 'John Lewis', host: ['johnlewis.'], hue: '#3d1f4a' },
  { id: 'argos', name: 'Argos', host: ['argos.co'], hue: '#d42114' },
  { id: 'zalando', name: 'Zalando', host: ['zalando.'], hue: '#ff6900' },
  { id: 'shopee', name: 'Shopee', host: ['shopee.'], hue: '#ee4d2d' },
  { id: 'lazada', name: 'Lazada', host: ['lazada.'], hue: '#0f146d' },
  { id: 'rakuten', name: 'Rakuten', host: ['rakuten.'], hue: '#bf0000' },
  { id: 'other', name: 'Other', host: [], hue: '#8b2942' },
]

export function storeFromUrl(url: string): StoreId {
  const host = url.toLowerCase()
  for (const store of STORES) {
    if (store.id === 'other') continue
    if (store.host.some((h) => host.includes(h))) return store.id
  }
  return 'other'
}

export function storeMeta(id: StoreId) {
  return STORES.find((s) => s.id === id) ?? STORES[STORES.length - 1]
}
