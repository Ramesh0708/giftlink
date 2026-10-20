import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Priority, WishItem } from '../types'
import { STORES, storeFromUrl } from '../data/stores'
import { previewUrl } from '../lib/api'
import { CURRENCIES, currencyFromUrl } from '../lib/format'
import { uid } from '../lib/ids'
import { MANUAL_FILL, isJunkProductTitle } from '../lib/product'
import { useRegion } from '../lib/region-context'

const empty = (): WishItem => ({
  id: uid(),
  title: '',
  url: '',
  image: '',
  price: null,
  currency: 'INR',
  store: 'other',
  notes: '',
  priority: 'want',
  reservedBy: null,
})

export default function ItemModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: WishItem
  onClose: () => void
  onSave: (item: WishItem) => void
}) {
  const { experience } = useRegion()
  const [item, setItem] = useState<WishItem>(() =>
    initial ? { ...initial } : { ...empty(), currency: experience?.currency ?? 'INR' },
  )
  const itemRef = useRef(item)
  itemRef.current = item
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const previewReq = useRef(0)

  const set = <K extends keyof WishItem>(key: K, value: WishItem[K]) => {
    const next = { ...itemRef.current, [key]: value }
    itemRef.current = next
    setItem(next)
  }

  function remember(next: WishItem) {
    itemRef.current = next
    setItem(next)
    return next
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function withLink(current: WishItem, url: string): WishItem {
    return {
      ...current,
      url: current.url || url,
      currency: currencyFromUrl(url, experience?.currency ?? current.currency),
      store: storeFromUrl(url),
    }
  }

  async function fetchPreview(url = itemRef.current.url) {
    if (!url) return itemRef.current
    const req = ++previewReq.current
    setBusy(true)
    setError('')
    try {
      const data = await previewUrl(url)
      if (req !== previewReq.current) return itemRef.current
      const current = withLink(itemRef.current, url)
      if (!data.title || isJunkProductTitle(data.title)) {
        setError(MANUAL_FILL)
        return remember(current)
      }
      const keepTitle = current.title.trim() && !isJunkProductTitle(current.title)
      const next = {
        ...current,
        title: keepTitle ? current.title : data.title,
        image: current.image || data.image || '',
        price: current.price ?? data.price,
      }
      if (!data.image && !next.image) {
        setError('Got the name, but the store hid the photo. Paste an image URL below, or add the price yourself.')
      }
      return remember(next)
    } catch {
      if (req !== previewReq.current) return itemRef.current
      setError(MANUAL_FILL)
      return remember(withLink(itemRef.current, url))
    } finally {
      if (req === previewReq.current) setBusy(false)
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    let next = itemRef.current
    if (next.url && !next.title.trim()) {
      next = await fetchPreview(next.url)
    } else {
      previewReq.current += 1
      setBusy(false)
    }
    if (!next.title.trim() || isJunkProductTitle(next.title)) {
      setError(next.url ? MANUAL_FILL : 'Give the gift a name.')
      return
    }
    onSave({
      ...next,
      store: next.url ? storeFromUrl(next.url) : next.store,
      reservedBy: initial?.reservedBy ?? null,
    })
  }

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{initial ? 'Edit gift' : 'Add a gift'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <p className="meta">
          {experience?.addGiftHint ??
            'Copy the product link from the shop, then paste it here.'}
        </p>
        <form className="form" onSubmit={(e) => void submit(e)}>
          <label>
            Product link
            <input
              value={item.url}
              onChange={(e) => set('url', e.target.value)}
              onBlur={() => void fetchPreview()}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData('text').trim()
                if (/^https?:\/\//i.test(pasted)) {
                  set('url', pasted)
                  window.setTimeout(() => void fetchPreview(pasted), 50)
                }
              }}
              placeholder={experience?.linkPlaceholder ?? 'https://…'}
            />
          </label>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy || !item.url}
            onClick={() => void fetchPreview()}
          >
            {busy ? 'Reading link…' : 'Fill from link'}
          </button>
          {item.image && (
            <img
              className="preview-photo"
              src={item.image}
              alt=""
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
          <label>
            What is it?
            <input
              value={item.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Kindred spirits mug"
            />
          </label>
          <div className="row-3">
            <label>
              Price
              <input
                type="number"
                min="0"
                value={item.price ?? ''}
                onChange={(e) =>
                  set('price', e.target.value === '' ? null : Number(e.target.value))
                }
                placeholder="1999"
              />
            </label>
            <label>
              Currency
              <select
                value={item.currency}
                onChange={(e) => set('currency', e.target.value as WishItem['currency'])}
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.id} value={currency.id}>
                    {currency.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Store
              <select
                value={item.store}
                onChange={(e) => set('store', e.target.value as WishItem['store'])}
              >
                {STORES.filter((store) => {
                  const featured = experience?.storeIds
                  if (!featured) return true
                  return featured.includes(store.id) || store.id === 'other' || store.id === item.store
                }).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Image URL (optional)
            <input
              value={item.image}
              onChange={(e) => set('image', e.target.value)}
              placeholder="https://…"
            />
          </label>
          <div>
            <label>How much do you want it?</label>
            <div className="priority">
              {(['love', 'want', 'nice'] as Priority[]).map((p) => (
                <button
                  type="button"
                  key={p}
                  className={item.priority === p ? 'on' : ''}
                  onClick={() => set('priority', p)}
                >
                  {p === 'love' ? 'Love this' : p === 'want' ? 'Want' : 'Nice to have'}
                </button>
              ))}
            </div>
          </div>
          <label>
            Note for gifters
            <textarea
              value={item.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Size M, black if possible…"
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="btn btn-primary btn-wide"
            type="submit"
            disabled={busy && !item.title.trim()}
          >
            {busy && !item.title.trim() ? 'Reading link…' : 'Save gift'}
          </button>
        </form>
      </div>
    </div>
  )
}
