import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { STORES } from '../data/stores'
import { loadAllLists } from '../lib/storage'

export default function Home() {
  const location = useLocation()
  const mine = useMemo(() => loadAllLists(), [location.key])

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Share what you actually want</p>
          <h1>Gifts without the awkward guessing.</h1>
          <p className="lede">
            Build a wishlist from Amazon, Flipkart, Myntra, and anywhere you shop.
            Connect a shared store list, send one link, and friends can reserve a
            gift so nobody doubles up.
          </p>
          <p>
            <Link className="btn btn-primary" to="/new">
              Start a wishlist
            </Link>
          </p>
        </div>
        <div className="hero-card" aria-hidden="true">
          <div className="hero-item">
            <div className="thumb" style={{ background: '#f3d0d6' }} />
            <div>
              <strong>Noise-cancelling headphones</strong>
              <div className="item-store">Amazon</div>
            </div>
            <span className="pill">₹7,999</span>
          </div>
          <div className="hero-item">
            <div className="thumb" style={{ background: '#d7e8ff' }} />
            <div>
              <strong>Forest green hoodie</strong>
              <div className="item-store">Myntra</div>
            </div>
            <span className="pill taken">Riya’s getting this</span>
          </div>
          <div className="hero-item">
            <div className="thumb" style={{ background: '#efe3d4' }} />
            <div>
              <strong>Cast iron dosa tawa</strong>
              <div className="item-store">Flipkart</div>
            </div>
            <span className="pill">₹1,249</span>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>How it works</h2>
        <div className="grid-3">
          <article className="card">
            <div className="step-num">1</div>
            <h3>Connect Amazon or Flipkart</h3>
            <p className="meta">
              Link a shared wishlist from Amazon or Flipkart, pick the gifts you
              want, then add them here. Or paste a single product link.
            </p>
          </article>
          <article className="card">
            <div className="step-num">2</div>
            <h3>Share one link</h3>
            <p className="meta">
              Send it to family or the group chat. They see the list without
              needing an account.
            </p>
          </article>
          <article className="card">
            <div className="step-num">3</div>
            <h3>They claim a gift</h3>
            <p className="meta">
              A friend taps “I’ll get this” so two people don’t buy the same
              thing. You won’t see who claimed it.
            </p>
          </article>
        </div>
      </section>

      <section className="section">
        <h2>Stores people already shop</h2>
        <p className="lede">
          Add items from these shops — or anywhere else with a product URL.
        </p>
        <div className="store-row">
          {STORES.filter((s) => s.id !== 'other').map((s) => (
            <span className="store-chip" key={s.id}>
              <span className="dot" style={{ background: s.hue }} />
              {s.name}
            </span>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="note">
          Amazon and Flipkart don’t allow apps to sign into your shopping
          account. Connect them with a shared wishlist link, or paste product
          URLs. GiftLink never asks for those passwords.
        </div>
      </section>

      {mine.length > 0 && (
        <section className="section">
          <h2>Your lists on this device</h2>
          <div className="lists">
            {mine.map((list) => (
              <Link className="card list-row" key={list.id} to={`/me/${list.id}`}>
                <div>
                  <strong>{list.recipient || 'Untitled wishlist'}</strong>
                  <p className="meta">
                    {list.occasion} · {list.items.length} item
                    {list.items.length === 1 ? '' : 's'}
                  </p>
                </div>
                <span className="btn btn-ghost">Open</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="site">
        GiftLink is a private list you share on purpose. Deploy it on Netlify
        and send the link — no app store, no guessing.
      </footer>
    </>
  )
}
