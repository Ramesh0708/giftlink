import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Priority, WishItem } from '../types'
import { STORES, storeFromUrl } from '../data/stores'
import { previewUrl } from '../lib/api'
import { uid } from '../lib/ids'

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
  const [item, setItem] = useState<WishItem>(initial ? { ...initial } : empty())
  const itemRef = useRef(item)
  itemRef.current = item
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const previewReq = useRef(0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function fetchPreview(url = itemRef.current.url) {
    if (!url) return itemRef.current
    const req = ++previewReq.current
    setBusy(true)
    setError('')
    try {
      const data = await previewUrl(url)
      if (req !== previewReq.current) return itemRef.current
      const next = {
        ...itemRef.current,
        title: itemRef.current.title || data.title,
        image: data.image || itemRef.current.image,
        price: itemRef.current.price ?? data.price,
        store: storeFromUrl(url),
      }
      setItem(next)
      itemRef.current = next
      if (!data.image) {
        setError('Got the name, but the store hid the photo. You can paste an image URL below.')
      }
      return next
    } catch {
      if (req !== previewReq.current) return itemRef.current
      const next = { ...itemRef.current, store: storeFromUrl(url) }
      setItem(next)
      itemRef.current = next
      setError('Could not auto-fill that page. Add the name, photo, and price yourself.')
      return next
    } finally {
      if (req === previewReq.current) setBusy(false)
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    let next = itemRef.current
    if (next.url && (!next.image || !next.title)) {
      next = await fetchPreview(next.url)
    }
    if (!next.title.trim()) {
      setError('Give the gift a name.')
      return
    }
    onSave({
      ...next,
      store: next.url ? storeFromUrl(next.url) : next.store,
      reservedBy: initial?.reservedBy ?? null,
    })
  }

  const set = <K extends keyof WishItem>(key: K, value: WishItem[K]) =>
    setItem((cur) => ({ ...cur, [key]: value }))

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
          Copy the product link from your browser address bar on Amazon, Flipkart,
          or any shop, then paste it here.
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
              placeholder="https://www.amazon.in/… or Flipkart, Myntra…"
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
          <div className="row-2">
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
              Store
              <select
                value={item.store}
                onChange={(e) => set('store', e.target.value as WishItem['store'])}
              >
                {STORES.map((s) => (
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
          {error && <p className="meta">{error}</p>}
          <button className="btn btn-primary btn-wide" type="submit" disabled={busy}>
            {busy ? 'Reading link…' : 'Save gift'}
          </button>
        </form>
      </div>
    </div>
  )
}
