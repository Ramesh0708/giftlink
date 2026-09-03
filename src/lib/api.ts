import type { StoredList, Wishlist } from '../types'

async function parse<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string }
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export async function publishList(list: StoredList): Promise<Wishlist> {
  const res = await fetch(`/api/wishlists/${list.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-owner-key': list.ownerKey,
    },
    body: JSON.stringify(list),
  })
  const data = await parse<{ list: Wishlist }>(res)
  return data.list
}

export async function fetchPublic(id: string): Promise<Wishlist> {
  const res = await fetch(`/api/wishlists/${id}`)
  const data = await parse<{ list: Wishlist }>(res)
  return data.list
}

export async function reserveItem(id: string, itemId: string, name: string) {
  const res = await fetch(`/api/wishlists/${id}/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId, name }),
  })
  const data = await parse<{ list: Wishlist }>(res)
  return data.list
}

export async function unreserveItem(id: string, itemId: string, name: string) {
  const res = await fetch(`/api/wishlists/${id}/unreserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId, name }),
  })
  const data = await parse<{ list: Wishlist }>(res)
  return data.list
}

export type PreviewResult = {
  title: string
  image: string
  price: number | null
}

export type ImportedItem = {
  key: string
  title: string
  url: string
  image: string
  price: number | null
  store: 'amazon' | 'flipkart' | 'other' | string
}

export type ImportResult = {
  store: string
  listName: string
  sourceUrl: string
  items: ImportedItem[]
}

export async function importWishlist(body: {
  url?: string
  text?: string
}): Promise<ImportResult> {
  const res = await fetch('/api/import-wishlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return parse<ImportResult>(res)
}

export async function previewUrl(url: string): Promise<PreviewResult> {
  const res = await fetch('/api/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  return parse<PreviewResult>(res)
}
