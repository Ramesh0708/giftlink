import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { storeMeta } from '../data/stores'
import { fetchPublic, reserveItem, unreserveItem } from '../lib/api'
import { claimTokenFor, claimTokens, forgetClaim, rememberClaim } from '../lib/claims'
import { money } from '../lib/format'
import { displayNote } from '../lib/note'
import { useRegion } from '../lib/region-context'
import { forwardCopy, publicShareUrl, whatsappForwardUrl } from '../lib/share'
import type { Wishlist } from '../types'

const NAME_KEY = 'giftlink:gifterName'

export default function View() {
  const { id = '' } = useParams()
  const [list, setList] = useState<Wishlist | null>(null)
  const [error, setError] = useState('')
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || '')
  const [busy, setBusy] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const { experience } = useRegion()

  useEffect(() => {
    let live = true
    fetchPublic(id, { tokens: claimTokens(id) })
      .then((data) => {
        if (live) setList(data)
      })
      .catch((err: unknown) => {
        if (live) setError(err instanceof Error ? err.message : 'Not found')
      })
    return () => {
      live = false
    }
  }, [id])

  function remember(value: string) {
    setName(value)
    localStorage.setItem(NAME_KEY, value)
  }

  async function claim(itemId: string) {
    if (!name.trim()) {
      setError('Add your name so others know it’s covered.')
      return
    }
    setBusy(itemId)
    setError('')
    try {
      const result = await reserveItem(id, itemId, name.trim(), claimTokens(id))
      rememberClaim(id, itemId, result.claimToken)
      setList(result.list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reserve')
    } finally {
      setBusy(null)
    }
  }

  async function undo(itemId: string) {
    const token = claimTokenFor(id, itemId)
    if (!token) {
      setError('This claim can only be undone from the browser that made it.')
      return
    }
    setBusy(itemId)
    setError('')
    try {
      const result = await unreserveItem(id, itemId, token, claimTokens(id))
      forgetClaim(id, itemId)
      setList(result.list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not undo')
    } finally {
      setBusy(null)
    }
  }

  if (error && !list) {
    return (
      <section className="section">
        <h1>This list isn’t available</h1>
        <p className="lede">
          {error}. If it’s new, the owner needs to add a gift — it goes live
          automatically — then send the link again.
        </p>
        <Link className="btn btn-primary" to="/">
          Back home
        </Link>
      </section>
    )
  }

  if (!list) return <p className="meta">Loading wishlist…</p>

  const openCount = list.items.filter((i) => !i.claimed && !i.reservedBy).length
  const who = list.recipient.trim()
  const shareText = forwardCopy(publicShareUrl(window.location.origin, id), list.recipient, list.occasion)

  async function copyForward() {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section>
      <div className="toolbar">
        <div>
          <p className="eyebrow">{list.occasion}</p>
          <h1>Gifts for {who || 'someone lovely'}</h1>
          <p className="lede">{displayNote(list.message, who)}</p>
          <p className="meta">
            {openCount} of {list.items.length} still free to claim. They won’t
            see who said they’d buy it.
          </p>
        </div>
        <div className="nav-actions">
          <a
            className="btn btn-whatsapp"
            href={whatsappForwardUrl(publicShareUrl(window.location.origin, id), list.recipient, list.occasion)}
            target="_blank"
            rel="noreferrer"
          >
            Share on WhatsApp
          </a>
          <button type="button" className="btn btn-ghost" onClick={() => void copyForward()}>
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 22, maxWidth: 420 }}>
        <p className="meta">
          {experience?.gifterHint ??
            'Type your name, tap I’ll get this, then buy it from the product link. They won’t see who claimed which gift.'}
        </p>
        <label>
          Your name (so the group doesn’t double-buy)
          <input
            value={name}
            onChange={(e) => remember(e.target.value)}
            placeholder={experience?.nameExample ?? 'Your name'}
          />
        </label>
        {error && <p className="meta">{error}</p>}
      </div>

      {list.items.length === 0 ? (
        <div className="card empty">
          <h3>No gifts on this list yet</h3>
        </div>
      ) : (
        <div className="items">
          {list.items.map((item) => {
            const store = storeMeta(item.store)
            const claimed = Boolean(item.claimed || item.reservedBy)
            const mine = Boolean(item.mine)
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
                  </div>
                  <strong>{item.title}</strong>
                  {item.price != null && (
                    <div className="price">{money(item.price, item.currency)}</div>
                  )}
                  {item.notes && <p className="meta">{item.notes}</p>}
                  {claimed && (
                    <span className="pill taken">{mine ? 'You’re getting this' : 'Claimed'}</span>
                  )}
                  <div className="item-actions">
                    {item.url && (
                      <a className="btn btn-primary btn-sm" href={item.url} target="_blank" rel="noreferrer">
                        Buy on {store.name}
                      </a>
                    )}
                    {!claimed && (
                      <button
                        className="btn btn-ghost btn-sm"
                        disabled={busy === item.id}
                        onClick={() => void claim(item.id)}
                      >
                        I’ll get this
                      </button>
                    )}
                    {mine && (
                      <button
                        className="btn btn-ghost btn-sm"
                        disabled={busy === item.id}
                        onClick={() => void undo(item.id)}
                      >
                        Unclaim
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
