import { useMemo, useState } from 'react'
import { importWishlist, type ImportedItem } from '../lib/api'
import { uid } from '../lib/ids'
import type { StoreId, StoreLink, WishItem } from '../types'

const STORES = [
  {
    id: 'amazon' as const,
    name: 'Amazon',
    hue: '#ff9900',
    how: 'On Amazon: Wish List → your list → Share → Anyone with the link. Paste that URL here.',
    placeholder: 'https://www.amazon.in/hz/wishlist/ls/…',
  },
  {
    id: 'flipkart' as const,
    name: 'Flipkart',
    hue: '#2874f0',
    how: 'On Flipkart: Wishlist → Share. If Flipkart blocks the page, paste product links instead.',
    placeholder: 'https://www.flipkart.com/wishlist…',
  },
]

export default function ConnectStore({
  storeId,
  existing,
  alreadyUrls,
  onClose,
  onImport,
}: {
  storeId: 'amazon' | 'flipkart'
  existing?: StoreLink
  alreadyUrls: string[]
  onClose: () => void
  onImport: (items: WishItem[], link: StoreLink) => void
}) {
  const store = STORES.find((s) => s.id === storeId)!
  const [url, setUrl] = useState(existing?.url || '')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fetched, setFetched] = useState<ImportedItem[] | null>(null)
  const [listName, setListName] = useState(existing?.name || '')
  const [picked, setPicked] = useState<Record<string, boolean>>({})

  const selected = useMemo(
    () => (fetched || []).filter((item) => picked[item.key]),
    [fetched, picked],
  )

  async function fetchList() {
    setBusy(true)
    setError('')
    setFetched(null)
    try {
      const data = await importWishlist({ url, text })
      setFetched(data.items)
      setListName(data.listName)
      if (data.sourceUrl && !url) setUrl(data.sourceUrl)
      const next: Record<string, boolean> = {}
      for (const item of data.items) {
        next[item.key] = !alreadyUrls.includes(item.url)
      }
      setPicked(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read that list')
    } finally {
      setBusy(false)
    }
  }

  function importPicked() {
    if (!selected.length) {
      setError('Pick at least one item.')
      return
    }
    const items: WishItem[] = selected.map((item) => ({
      id: uid(),
      title: item.title,
      url: item.url,
      image: item.image || '',
      price: item.price,
      currency: 'INR',
      store: (item.store as StoreId) || storeId,
      notes: '',
      priority: 'want',
      reservedBy: null,
    }))
    onImport(items, {
      store: storeId,
      url: url || selected[0].url,
      name: listName || `${store.name} wishlist`,
      linkedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <p className="eyebrow" style={{ color: store.hue }}>
          {store.name}
        </p>
        <h2>Connect {store.name} wishlist</h2>
        <p className="meta">{store.how}</p>
        <p className="meta">
          Amazon and Flipkart don’t let apps sign into your shopping account.
          GiftLink never asks for those passwords.
        </p>
        <div className="form" style={{ marginTop: 14 }}>
          <label>
            Shared wishlist link
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={store.placeholder}
            />
          </label>
          <label>
            Or paste product links (one per line)
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`https://www.${storeId === 'amazon' ? 'amazon.in/dp/…' : 'flipkart.com/…/p/itm…'}`}
            />
          </label>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || (!url.trim() && !text.trim())}
            onClick={() => void fetchList()}
          >
            {busy ? 'Reading list…' : 'Fetch items'}
          </button>
        </div>

        {fetched && (
          <div style={{ marginTop: 18 }}>
            <div className="toolbar" style={{ padding: 0 }}>
              <p className="meta">
                {listName} · {selected.length} of {fetched.length} selected
              </p>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  const allOn = selected.length !== fetched.length
                  const next: Record<string, boolean> = {}
                  for (const item of fetched) next[item.key] = allOn
                  setPicked(next)
                }}
              >
                {selected.length === fetched.length ? 'Clear' : 'Select all'}
              </button>
            </div>
            <div className="pick-list">
              {fetched.map((item) => (
                <label className="pick-row" key={item.key}>
                  <input
                    type="checkbox"
                    checked={Boolean(picked[item.key])}
                    onChange={(e) =>
                      setPicked((cur) => ({ ...cur, [item.key]: e.target.checked }))
                    }
                  />
                  {item.image ? (
                    <img src={item.image} alt="" />
                  ) : (
                    <span className="pick-ph" />
                  )}
                  <span>
                    <strong>{item.title}</strong>
                    {item.price != null && (
                      <span className="meta"> · ₹{item.price.toLocaleString('en-IN')}</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
            <button type="button" className="btn btn-sage btn-wide" onClick={importPicked}>
              Add {selected.length} to GiftLink
            </button>
          </div>
        )}
        {error && <p className="meta" style={{ marginTop: 12 }}>{error}</p>}
      </div>
    </div>
  )
}
