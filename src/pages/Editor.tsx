import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ConnectStore from '../components/ConnectStore'
import ItemModal from '../components/ItemModal'
import { isDefaultOccasion } from '../data/regions'
import { storeMeta } from '../data/stores'
import { fetchPublic, publishList } from '../lib/api'
import { money } from '../lib/format'
import { defaultNote, isStockNote } from '../lib/note'
import { useRegion } from '../lib/region-context'
import { publicShareUrl, shareCopy, whatsappShareUrl } from '../lib/share'
import { loadList, removeList, saveList } from '../lib/storage'
import type { StoredList, StoreLink, WishItem } from '../types'

export default function Editor() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { region, experience } = useRegion()
  const [list, setList] = useState<StoredList | null>(() => loadList(id))
  const [modal, setModal] = useState<WishItem | 'new' | null>(null)
  const [connect, setConnect] = useState<'amazon' | 'flipkart' | null>(null)
  const [toast, setToast] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [shareReady, setShareReady] = useState(() => Boolean(loadList(id)?.published))
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const syncTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const shareUrl = useMemo(
    () => (id ? publicShareUrl(window.location.origin, id) : ''),
    [id],
  )

  function flash(message: string) {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 3200)
  }

  useEffect(() => {
    if (sessionStorage.getItem('giftlink:creating') === id) {
      sessionStorage.removeItem('giftlink:creating')
    }
    const loaded = loadList(id)
    setList(loaded)
    setShareReady(Boolean(loaded?.published))
    if (!loaded || loaded.published) return
    void fetchPublic(id, { peek: true })
      .then(() => {
        const latest = loadList(id)
        if (!latest) return
        const marked = { ...latest, published: true }
        saveList(marked)
        setList(marked)
        setShareReady(true)
      })
      .catch(() => {})
    return () => {
      window.clearTimeout(toastTimer.current)
      window.clearTimeout(syncTimer.current)
    }
  }, [id])

  useEffect(() => {
    if (!region || !experience) return
    setList((cur) => {
      if (!cur || cur.items.length > 0 || cur.recipient.trim()) return cur
      const occasion = isDefaultOccasion(cur.occasion) ? experience.occasion : cur.occasion
      const message = isStockNote(cur.message) ? defaultNote(cur.recipient, region) : cur.message
      if (occasion === cur.occasion && message === cur.message) return cur
      const next = { ...cur, occasion, message, updatedAt: new Date().toISOString() }
      saveList(next)
      return next
    })
  }, [region, experience])

  function persist(next: StoredList, sync: false | true | 'debounced' = false) {
    const updated = { ...next, updatedAt: new Date().toISOString() }
    saveList(updated)
    setList(updated)
    if (sync === true) void publish(updated, { quiet: true })
    if (sync === 'debounced' && updated.published) {
      window.clearTimeout(syncTimer.current)
      syncTimer.current = setTimeout(() => {
        const latest = loadList(updated.id)
        if (latest?.published) void publish(latest, { quiet: true })
      }, 900)
    }
    return updated
  }

  async function publish(
    next = list,
    opts: { quiet?: boolean } = {},
  ): Promise<boolean> {
    if (!next) return false
    if (!next.recipient.trim()) {
      flash('Add your name first. Friends will see “Gifts for your name”.')
      return false
    }
    setPublishing(true)
    try {
      await publishList(next)
      const marked = { ...next, published: true }
      saveList(marked)
      setList(marked)
      setShareReady(true)
      if (!opts.quiet) flash(experience?.publishFlash ?? 'Published.')
      return true
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Could not publish yet.')
      return false
    } finally {
      setPublishing(false)
    }
  }

  async function shareWhatsApp() {
    if (!list) return
    const popup = window.open('', '_blank')
    const ok = await publish(list)
    const href = whatsappShareUrl(shareUrl, list.recipient || list.occasion)
    if (!ok) {
      popup?.close()
      return
    }
    if (popup) popup.location.replace(href)
    else window.location.assign(href)
  }

  async function copyLink() {
    if (!list) return
    const ok = await publish(list)
    if (!ok) return
    const text = shareCopy(shareUrl, list.recipient || list.occasion)
    try {
      await navigator.clipboard.writeText(text)
      flash(experience?.copiedFlash ?? 'Message copied.')
    } catch {
      flash(shareUrl)
    }
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
    const seen = new Set(current.items.map((i) => i.url).filter(Boolean))
    const fresh = items.filter((i) => !i.url || !seen.has(i.url))
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
    flash(
      fresh.length
        ? `Added ${fresh.length} from ${link.name}.`
        : 'Those items are already on this list.',
    )
    if (fresh.length) void publish(next)
  }

  const amazonLink = (list.links || []).find((l) => l.store === 'amazon')
  const flipkartLink = (list.links || []).find((l) => l.store === 'flipkart')
  const preferWhatsApp = experience?.preferWhatsApp ?? false
  const showFlipkart = (experience?.showFlipkart ?? false) || Boolean(flipkartLink)

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
          {preferWhatsApp ? (
            <>
              <button className="btn btn-whatsapp" onClick={() => void shareWhatsApp()}>
                WhatsApp
              </button>
              <button className="btn btn-ghost" onClick={() => void copyLink()}>
                Copy share text
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-primary" onClick={() => void copyLink()}>
                Copy message
              </button>
              <button className="btn btn-whatsapp" onClick={() => void shareWhatsApp()}>
                WhatsApp
              </button>
            </>
          )}
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
              onChange={(e) => {
                const recipient = e.target.value
                persist(
                  {
                    ...list,
                    recipient,
                    message: isStockNote(list.message)
                      ? defaultNote(recipient, region ?? 'india')
                      : list.message,
                  },
                  'debounced',
                )
              }}
              placeholder="Your name"
            />
          </label>
          <label>
            Occasion
            <input
              value={list.occasion}
              onChange={(e) => persist({ ...list, occasion: e.target.value }, 'debounced')}
              placeholder={experience?.occasionHint ?? 'Birthday, holiday…'}
            />
          </label>
        </div>
        <p className="meta">
          Friends see “Gifts for {list.recipient.trim() || 'your name'}”.
        </p>
        <label>
          Note at the top of the list
          <textarea
            value={list.message}
            onChange={(e) => persist({ ...list, message: e.target.value }, 'debounced')}
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
            <p className="meta">{experience?.liveHint}</p>
            <div className="nav-actions">
              {preferWhatsApp ? (
                <>
                  <button className="btn btn-whatsapp" onClick={() => void shareWhatsApp()}>
                    Send on WhatsApp
                  </button>
                  <button className="btn btn-ghost" onClick={() => void copyLink()}>
                    Copy message
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-primary" onClick={() => void copyLink()}>
                    Copy message
                  </button>
                  <button className="btn btn-whatsapp" onClick={() => void shareWhatsApp()}>
                    WhatsApp
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="card note" style={{ marginBottom: 22 }}>
        <strong>Do this in order</strong>
        <ol className="guide-ol">
          <li>Write your name and occasion above.</li>
          <li>{experience?.editorAdd}</li>
          <li>{experience?.editorShare}</li>
        </ol>
      </div>

      <div className="link-grid">
        <article className="card store-card">
          <div className="store-chip" style={{ border: 0, padding: 0, background: 'transparent' }}>
            <span className="dot" style={{ background: '#ff9900' }} />
            Amazon
          </div>
          <p className="meta">
            {amazonLink
              ? `Linked: ${amazonLink.name}`
              : 'Pull items from a shared Amazon wishlist.'}
          </p>
          <button className="btn btn-ghost btn-sm" onClick={() => setConnect('amazon')}>
            {amazonLink ? 'Update Amazon list' : 'Connect Amazon'}
          </button>
        </article>
        {showFlipkart && (
          <article className="card store-card">
            <div className="store-chip" style={{ border: 0, padding: 0, background: 'transparent' }}>
              <span className="dot" style={{ background: '#2874f0' }} />
              Flipkart
            </div>
            <p className="meta">
              {flipkartLink
                ? `Linked: ${flipkartLink.name}`
                : 'Pull items from a shared Flipkart wishlist.'}
            </p>
            <button className="btn btn-ghost btn-sm" onClick={() => setConnect('flipkart')}>
              {flipkartLink ? 'Update Flipkart list' : 'Connect Flipkart'}
            </button>
          </article>
        )}
      </div>

      {list.items.length === 0 ? (
        <div className="card empty">
          <h3>Nothing here yet</h3>
          <p>{experience?.emptyBody}</p>
          <div className="nav-actions" style={{ justifyContent: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setConnect('amazon')}>
              Connect Amazon
            </button>
            {showFlipkart && (
              <button className="btn btn-ghost btn-sm" onClick={() => setConnect('flipkart')}>
                Connect Flipkart
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => setModal('new')}>
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
                      className="btn btn-ghost btn-sm"
                      onClick={() => setModal(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        const next = persist({
                          ...list,
                          items: list.items.filter((i) => i.id !== item.id),
                        })
                        if (next.published) void publish(next, { quiet: true })
                      }}
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
              navigate('/', { replace: true })
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
          alreadyUrls={list.items.map((i) => i.url).filter(Boolean)}
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
