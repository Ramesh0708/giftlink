import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ItemModal from '../components/ItemModal'
import { storeMeta } from '../data/stores'
import { publishList } from '../lib/api'
import { money } from '../lib/format'
import { loadList, removeList, saveList } from '../lib/storage'
import type { StoredList, WishItem } from '../types'

export default function Editor() {
  const { id = '' } = useParams()
  const [list, setList] = useState<StoredList | null>(() => loadList(id))
  const [modal, setModal] = useState<WishItem | 'new' | null>(null)
  const [toast, setToast] = useState('')
  const [publishing, setPublishing] = useState(false)
  const shareUrl = useMemo(
    () => (id ? `${window.location.origin}/w/${id}` : ''),
    [id],
  )

  useEffect(() => {
    setList(loadList(id))
  }, [id])

  function persist(next: StoredList) {
    const updated = { ...next, updatedAt: new Date().toISOString() }
    saveList(updated)
    setList(updated)
    return updated
  }

  async function publish(next = list) {
    if (!next) return
    setPublishing(true)
    try {
      await publishList(next)
      setToast('Published — friends can open the share link now.')
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not publish yet.')
    } finally {
      setPublishing(false)
      window.setTimeout(() => setToast(''), 3200)
    }
  }

  async function copyLink() {
    if (!list) return
    await publish(list)
    try {
      await navigator.clipboard.writeText(shareUrl)
      setToast('Share link copied.')
    } catch {
      setToast(shareUrl)
    }
    window.setTimeout(() => setToast(''), 3200)
  }

  if (!list) {
    return (
      <section className="section">
        <h1>List not on this device</h1>
        <p className="lede">
          Wishlists are edited from the browser that created them. Open your
          share link to view it, or start a new list.
        </p>
        <Link className="btn btn-primary" to="/new">
          Create wishlist
        </Link>
      </section>
    )
  }

  const current = list

  function saveItem(item: WishItem) {
    const exists = current.items.some((i) => i.id === item.id)
    const next = persist({
      ...current,
      items: exists
        ? current.items.map((i) => (i.id === item.id ? item : i))
        : [item, ...current.items],
    })
    setModal(null)
    void publish(next)
  }

  return (
    <section>
      <div className="toolbar">
        <div>
          <p className="eyebrow">Your private editor</p>
          <h1>{list.recipient || 'Name this wishlist'}</h1>
          <p className="meta">
            Friends use {shareUrl} — they never see this edit screen.
          </p>
        </div>
        <div className="nav-actions">
          <button className="btn btn-ghost" onClick={() => void copyLink()}>
            Copy share link
          </button>
          <button className="btn btn-primary" onClick={() => setModal('new')}>
            Add gift
          </button>
        </div>
      </div>

      <div className="card form" style={{ marginBottom: 22 }}>
        <div className="row-2">
          <label>
            Who is this for?
            <input
              value={list.recipient}
              onChange={(e) => persist({ ...list, recipient: e.target.value })}
              placeholder="Your name"
            />
          </label>
          <label>
            Occasion
            <input
              value={list.occasion}
              onChange={(e) => persist({ ...list, occasion: e.target.value })}
              placeholder="Birthday, Diwali, just because"
            />
          </label>
        </div>
        <label>
          Note at the top of the list
          <textarea
            value={list.message}
            onChange={(e) => persist({ ...list, message: e.target.value })}
          />
        </label>
        <button
          className="btn btn-sage"
          disabled={publishing}
          onClick={() => void publish()}
        >
          {publishing ? 'Publishing…' : 'Publish so friends can see it'}
        </button>
      </div>

      {list.items.length === 0 ? (
        <div className="card empty">
          <h3>Nothing here yet</h3>
          <p>Paste an Amazon or Flipkart link, or add a gift by name.</p>
          <button className="btn btn-primary" onClick={() => setModal('new')}>
            Add your first gift
          </button>
        </div>
      ) : (
        <div className="items">
          {list.items.map((item) => {
            const store = storeMeta(item.store)
            return (
              <article className="item-card" key={item.id}>
                {item.image ? (
                  <img className="item-photo" src={item.image} alt="" />
                ) : (
                  <div className="item-photo" />
                )}
                <div className="item-body">
                  <div className="item-store" style={{ color: store.hue }}>
                    {store.name}
                    {item.priority === 'love' ? ' · favourite' : ''}
                  </div>
                  <strong>{item.title}</strong>
                  {item.price != null && (
                    <div className="price">{money(item.price, item.currency)}</div>
                  )}
                  {item.notes && <p className="meta">{item.notes}</p>}
                  <div className="item-actions">
                    <button
                      className="btn btn-ghost"
                      onClick={() => setModal(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() =>
                        persist({
                          ...list,
                          items: list.items.filter((i) => i.id !== item.id),
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <p className="meta" style={{ marginTop: 28 }}>
        <button
          className="btn btn-ghost"
          onClick={() => {
            if (confirm('Remove this list from this browser?')) {
              removeList(list.id)
              window.location.href = '/'
            }
          }}
        >
          Delete from this device
        </button>
      </p>

      {modal && (
        <ItemModal
          initial={modal === 'new' ? undefined : modal}
          onClose={() => setModal(null)}
          onSave={saveItem}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </section>
  )
}
