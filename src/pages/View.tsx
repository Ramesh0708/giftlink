import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import Envelope from '../components/Envelope'
import ThemeDecor from '../components/ThemeDecor'
import { storeMeta } from '../data/stores'
import { fetchPublic, reserveItem, unreserveItem } from '../lib/api'
import { claimTokenFor, claimTokens, forgetClaim, rememberClaim } from '../lib/claims'
import { envelopeKey, shouldSealEnvelope, themeForOccasion } from '../lib/delight.mjs'
import { money } from '../lib/format'
import { displayNote } from '../lib/note'
import { displayPhoto } from '../lib/photos.mjs'
import { useRegion } from '../lib/region-context'
import { forwardCopy, publicShareUrl, whatsappForwardUrl } from '../lib/share'
import { gaEvent, track } from '../lib/track'
import type { Wishlist } from '../types'

const NAME_KEY = 'giftlink:gifterName'

function tiltOf(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i) * (i + 3)) % 7
  return hash - 3
}

function tapeOf(id: string) {
  let hash = 0
  for (const char of id) hash += char.charCodeAt(0)
  return String(hash % 4)
}

function sealFor(listId: string) {
  try {
    return shouldSealEnvelope({
      seen: localStorage.getItem(envelopeKey(listId)) === '1',
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      userAgent: navigator.userAgent,
      webdriver: navigator.webdriver,
    })
  } catch {
    return false
  }
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function View() {
  const { id = '' } = useParams()
  const [list, setList] = useState<Wishlist | null>(null)
  const [error, setError] = useState('')
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || '')
  const [busy, setBusy] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [sealed, setSealed] = useState(() => sealFor(id))
  const [opening, setOpening] = useState(false)
  const [celebrating, setCelebrating] = useState<string | null>(null)
  const [canToss, setCanToss] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const tidyRef = useRef<(() => void) | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const { experience } = useRegion()

  useEffect(() => {
    setSealed(sealFor(id))
    setOpening(false)
  }, [id])

  useEffect(() => {
    let live = true
    fetchPublic(id, { tokens: claimTokens(id) })
      .then((data) => {
        if (!live) return
        setList(data)
        gaEvent('open', { listId: id })
      })
      .catch((err: unknown) => {
        if (live) setError(err instanceof Error ? err.message : 'Not found')
      })
    return () => {
      live = false
    }
  }, [id])

  useEffect(() => {
    if (!list || sealed) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (reducedMotion()) return
    let dead = false
    let stop = () => {}
    void import('../lib/toss').then((mod) => {
      if (dead || !gridRef.current) return
      const handle = mod.attachToss(gridRef.current, () => {})
      tidyRef.current = handle.reset
      stop = handle.stop
      setCanToss(true)
    })
    return () => {
      dead = true
      stop()
      tidyRef.current = null
      setCanToss(false)
    }
  }, [list, sealed])

  function remember(value: string) {
    setName(value)
    localStorage.setItem(NAME_KEY, value)
  }

  async function claim(itemId: string, source?: HTMLElement) {
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
      gaEvent('claim', { listId: id })
      if (!reducedMotion()) {
        setCelebrating(itemId)
        window.setTimeout(() => setCelebrating((current) => (current === itemId ? null : current)), 1700)
        if (typeof navigator.vibrate === 'function') navigator.vibrate(16)
        const rect = source?.getBoundingClientRect()
        const origin = rect
          ? {
              x: (rect.left + rect.width / 2) / window.innerWidth,
              y: (rect.top + rect.height / 2) / window.innerHeight,
            }
          : { x: 0.5, y: 0.4 }
        void import('../lib/celebrate').then((mod) => mod.burstFrom(origin, list?.occasion || ''))
      }
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
      <section className="desk">
        <div className="desk-note">
          <h1>This list isn’t available</h1>
          <p className="desk-message">
            {error}. If it’s new, the owner needs to add a gift — it goes live
            automatically — then send the link again.
          </p>
          <Link className="btn btn-primary" to="/">
            Back home
          </Link>
        </div>
      </section>
    )
  }

  if (!list) return <p className="meta">Loading wishlist…</p>

  const openCount = list.items.filter((i) => !i.claimed && !i.reservedBy).length
  const who = list.recipient.trim()
  const claimedOne = list.items.some((item) => item.mine)
  const shareText = forwardCopy(publicShareUrl(window.location.origin, id), list.recipient, list.occasion)

  function rememberEnvelope() {
    try {
      localStorage.setItem(envelopeKey(id), '1')
    } catch {
      /* private mode can refuse storage */
    }
  }

  function openEnvelope() {
    if (opening) return
    rememberEnvelope()
    setOpening(true)
    window.setTimeout(() => {
      setSealed(false)
      headingRef.current?.focus()
    }, 680)
    window.setTimeout(() => setOpening(false), 1200)
  }

  function skipEnvelope() {
    rememberEnvelope()
    setSealed(false)
    setOpening(false)
    headingRef.current?.focus()
  }

  async function copyForward() {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const theme = themeForOccasion(list.occasion)

  return (
    <section className={`desk${sealed ? ' is-sealed' : ''}${opening ? ' is-opening' : ''}`} data-theme={theme}>
      {sealed && (
        <Envelope
          name={who || 'someone lovely'}
          occasion={list.occasion}
          opening={opening}
          onOpen={openEnvelope}
          onSkip={skipEnvelope}
        />
      )}
      <div className="desk-sheet" inert={sealed ? true : undefined} aria-hidden={sealed || undefined}>
      <header className="desk-note">
        <ThemeDecor theme={theme} />
        <p className="desk-occasion">{list.occasion}</p>
        <h1 ref={headingRef} tabIndex={-1}>Gifts for {who || 'someone lovely'}</h1>
        <p className="desk-message">{displayNote(list.message, who)}</p>
        <p className="desk-count">
          {openCount} of {list.items.length} still free to claim. They won’t
          see who said they’d buy it.
        </p>
        <div className="desk-share">
          <a
            className="btn btn-whatsapp"
            href={whatsappForwardUrl(publicShareUrl(window.location.origin, id), list.recipient, list.occasion)}
            target="_blank"
            rel="noreferrer"
            onClick={() => track('share', { listId: id })}
          >
            Share on WhatsApp
          </a>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              track('share', { listId: id })
              void copyForward()
            }}
          >
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      </header>

      <div className="index-card">
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
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <OwnListCta id={id} afterClaim={false} />

      {list.items.length === 0 ? (
        <div className="empty">
          <h2>No gifts on this list yet</h2>
        </div>
      ) : (
        <>
        {canToss && (
          <div className="tidy-row">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => tidyRef.current?.()}>
              Tidy up
            </button>
          </div>
        )}
        <div className="desk-grid" ref={gridRef}>
          {list.items.map((item, index) => {
            const store = storeMeta(item.store)
            const claimed = Boolean(item.claimed || item.reservedBy)
            const mine = Boolean(item.mine)
            const eager = index === 0
            return (
              <article
                className="polaroid"
                key={item.id}
                data-tape={tapeOf(item.id)}
                style={{ '--tilt': `${tiltOf(item.id)}deg` } as CSSProperties}
              >
                <span className="washi" aria-hidden="true" />
                <div className="polaroid-frame">
                  {item.image ? (
                    <img
                      className="polaroid-photo"
                      src={displayPhoto(item.image, 'card')}
                      alt=""
                      width={800}
                      height={800}
                      loading={eager ? 'eager' : 'lazy'}
                      fetchPriority={eager ? 'high' : 'low'}
                      decoding="async"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.visibility = 'hidden'
                      }}
                    />
                  ) : (
                    <div className="polaroid-photo" />
                  )}
                  {claimed && <span className="stamp">Claimed</span>}
                  {celebrating === item.id && (
                    <div className="unwrap" role="status">
                      <div className="giftbox" aria-hidden="true">
                        <span className="giftbox-bow" />
                        <span className="giftbox-lid" />
                        <span className="giftbox-base" />
                      </div>
                      <p>You’re getting this</p>
                    </div>
                  )}
                </div>
                <div className="polaroid-caption">
                  <p className="polaroid-store">{store.name}</p>
                  <h2 className="polaroid-title">{item.title}</h2>
                  {item.price != null && (
                    <div className="price">{money(item.price, item.currency)}</div>
                  )}
                  {item.notes && <p className="meta">{item.notes}</p>}
                  {mine && <p className="mine-note">You’re getting this</p>}
                  <div className="polaroid-actions">
                    {item.url && (
                      <a
                        className="buy-link"
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => track('buy', { listId: id })}
                      >
                        Buy on {store.name}
                      </a>
                    )}
                    {!claimed && (
                      <button
                        type="button"
                        className="gift-tag"
                        disabled={busy === item.id}
                        onClick={(event) => void claim(item.id, event.currentTarget)}
                      >
                        I’ll get this
                      </button>
                    )}
                    {mine && (
                      <button
                        type="button"
                        className="unclaim"
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
        </>
      )}

      {claimedOne && <OwnListCta id={id} afterClaim />}
      <p className="associate">As an Amazon Associate, GiftLink earns from qualifying purchases.</p>
      </div>
    </section>
  )
}

function OwnListCta({ id, afterClaim }: { id: string; afterClaim: boolean }) {
  return (
    <aside className="cta-band">
      <p className="eyebrow">{afterClaim ? 'You claimed a gift' : 'Like this list?'}</p>
      <h2>Make your own GiftLink</h2>
      <p>
        {afterClaim
          ? 'Now share what you want. Add a product link, and send one WhatsApp message of your own.'
          : 'Build a list of gifts you actually want. It goes live when you add the first one.'}
      </p>
      <Link className="btn" to={`/new?ref=${encodeURIComponent(id)}`}>
        Make your own GiftLink
      </Link>
    </aside>
  )
}
