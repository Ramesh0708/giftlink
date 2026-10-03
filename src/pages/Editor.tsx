import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ConnectStore from '../components/ConnectStore'
import ItemModal from '../components/ItemModal'
import { storeMeta } from '../data/stores'
import { publishList } from '../lib/api'
import { money } from '../lib/format'
import { publicShareUrl, shareCopy, whatsappShareUrl } from '../lib/share'
import { loadList, removeList, saveList } from '../lib/storage'
import type { StoredList, StoreLink, WishItem } from '../types'

export default function Editor() {
  const { id = '' } = useParams()
  const [list, setList] = useState<StoredList | null>(() => loadList(id))
  const [modal, setModal] = useState<WishItem | 'new' | null>(null)
  const [connect, setConnect] = useState<'amazon' | 'flipkart' | null>(null)
  const [toast, setToast] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [shareReady, setShareReady] = useState(false)
  const shareUrl = useMemo(
    () => (id ? publicShareUrl(window.location.origin, id) : ''),
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
      setShareReady(true)
      setToast('Published — send the WhatsApp message next.')
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not publish yet.')
    } finally {
      setPublishing(false)
      window.setTimeout(() => setToast(''), 3200)
    }
  }

  async function shareWhatsApp() {
    if (!list) return
    await publish(list)
    const href = whatsappShareUrl(shareUrl, list.recipient || list.occasion)
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  async function copyLink() {
    if (!list) return
    await publish(list)
    const text = shareCopy(shareUrl, list.recipient || list.occasion)
    try {
      await navigator.clipboard.writeText(text)
      setToast('WhatsApp-ready message copied.')
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

  function importFromStore(items: WishItem[], link: StoreLink) {
    const seen = new Set(current.items.map((i) => i.url))
    const fresh = items.filter((i) => !seen.has(i.url))
    const links = [
      link,
      ...(current.links || []).filter((l) => l.store !== link.store),
    ]
    const next = persist({
      ...current,
      items: [...fresh, ...current.items],
      links,
    })
    setConnect(null)
    setToast(
      fresh.length
        ? `Added ${fresh.length} from ${link.name}.`
        : 'Those items are already on this list.',
    )
    window.setTimeout(() => setToast(''), 3200)
    if (fresh.length) void publish(next)
  }

  const amazonLink = (list.links || []).find((l) => l.store === 'amazon')
  const flipkartLink = (list.links || []).find((l) => l.store === 'flipkart')

  return (
    <section>
      <div className="toolbar">
        <div>
          <p className="eyebrow">Your private editor</p>
          <h1>{list.recipient || 'Name this wishlist'}</h1>
          <p className="meta">
            Friends use {shareUrl} — they never see this edit screen.{' '}
            <Link to="/how-to">Need a walkthrough?</Link>
          </p>
        </div>
        <div className="nav-actions">
          <button className="btn btn-ghost" onClick={() => void copyLink()}>
            Copy share text
          </button>
          <button className="btn btn-whatsapp" onClick={() => void shareWhatsApp()}>
            WhatsApp
          </button>
          <button className="btn btn-primary" onClick={() => setModal('new')}>
            Add gift
          </button>
        </div>
      </div>

      <div className="card note" style={{ marginBottom: 22 }}>
        <strong>Do this in order</strong>
        <ol className="guide-ol">
          <li>Write your name and occasion above.</li>
          <li>
            Tap <strong>Add gift</strong> and paste a product link from Amazon or
            Flipkart — or connect a whole shared wishlist below.
          </li>
          <li>
            Tap <strong>Publish</strong>, then <strong>WhatsApp</strong> — send the
            ready message. Friends must open the <code>/w/…</code> link, not this
            editor page.
          </li>
        </ol>
      </div>

      <div className="link-grid">
        <article className="card">
          <div className="store-chip" style={{ border: 0, padding: 0 }}>
            <span className="dot" style={{ background: '#ff9900' }} />
            Amazon
          </div>
          <p className="meta">
            {amazonLink
              ? `Linked: ${amazonLink.name}`
              : 'Pull items from a shared Amazon wishlist.'}
          </p>
          <button className="btn btn-ghost" onClick={() => setConnect('amazon')}>
            {amazonLink ? 'Update Amazon list' : 'Connect Amazon'}
          </button>
        </article>
        <article className="card">
          <div className="store-chip" style={{ border: 0, padding: 0 }}>
            <span className="dot" style={{ background: '#2874f0' }} />
            Flipkart
          </div>
          <p className="meta">
            {flipkartLink
              ? `Linked: ${flipkartLink.name}`
              : 'Pull items from a shared Flipkart wishlist.'}
          </p>
          <button className="btn btn-ghost" onClick={() => setConnect('flipkart')}>
            {flipkartLink ? 'Update Flipkart list' : 'Connect Flipkart'}
          </button>
        </article>
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
              placeholder="Diwali 2026, birthday…"
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
        {shareReady && (
          <div className="share-bar">
            <p className="meta">
              List is live. Send this — it already includes the sale note and your
              <code>/w/</code> link.
            </p>
            <div className="nav-actions">
              <button className="btn btn-whatsapp" onClick={() => void shareWhatsApp()}>
                Send on WhatsApp
              </button>
              <button className="btn btn-ghost" onClick={() => void copyLink()}>
                Copy message
              </button>
            </div>
          </div>
        )}
      </div>

      {list.items.length === 0 ? (
        <div className="card empty">
          <h3>Nothing here yet</h3>
          <p>Connect Amazon or Flipkart, or add a gift by name.</p>
          <div className="nav-actions" style={{ justifyContent: 'center' }}>
            <button className="btn btn-ghost" onClick={() => setConnect('amazon')}>
              Connect Amazon
            </button>
            <button className="btn btn-ghost" onClick={() => setConnect('flipkart')}>
              Connect Flipkart
            </button>
            <button className="btn btn-primary" onClick={() => setModal('new')}>
              Add your first gift
            </button>
          </div>
        </div>
      ) : (
        <div className="items">
          {list.items.map((item) => {
            const store = storeMeta(item.store)
            return (
              <article className="item-card" key={item.id}>
                {item.image ? (
                  <img
                    className="item-photo"
                    src={item.image}
                    alt=""
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
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

      {connect && (
        <ConnectStore
          storeId={connect}
          existing={connect === 'amazon' ? amazonLink : flipkartLink}
          alreadyUrls={list.items.map((i) => i.url)}
          onClose={() => setConnect(null)}
          onImport={importFromStore}
        />
      )}
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
