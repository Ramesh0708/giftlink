import { useState, type FormEvent } from 'react'
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
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function fetchPreview() {
    if (!item.url) return
    setBusy(true)
    setError('')
    try {
      const data = await previewUrl(item.url)
      setItem((cur) => ({
        ...cur,
        title: cur.title || data.title,
        image: cur.image || data.image,
        price: cur.price ?? data.price,
        store: storeFromUrl(item.url),
      }))
    } catch {
      setItem((cur) => ({ ...cur, store: storeFromUrl(item.url) }))
      setError('Could not auto-fill that page. Add the name and price yourself.')
    } finally {
      setBusy(false)
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!item.title.trim()) {
      setError('Give the gift a name.')
      return
    }
    onSave({
      ...item,
      store: item.url ? storeFromUrl(item.url) : item.store,
      reservedBy: initial?.reservedBy ?? null,
    })
  }

  const set = <K extends keyof WishItem>(key: K, value: WishItem[K]) =>
    setItem((cur) => ({ ...cur, [key]: value }))

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{initial ? 'Edit gift' : 'Add a gift'}</h2>
        <form className="form" onSubmit={submit}>
          <label>
            Product link
            <input
              value={item.url}
              onChange={(e) => set('url', e.target.value)}
              onBlur={() => void fetchPreview()}
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
          <button className="btn btn-primary btn-wide" type="submit">
            Save gift
          </button>
        </form>
      </div>
    </div>
  )
}
