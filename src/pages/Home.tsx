import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import StepPlayer from '../components/StepPlayer'
import { landings } from '../data/landings.mjs'
import { occasionBanner } from '../lib/occasions.mjs'
import { displayPhoto } from '../lib/photos.mjs'
import { storeMeta } from '../data/stores'
import { useRegion } from '../lib/region-context'
import { loadAllLists } from '../lib/storage'

export default function Home() {
  const { experience } = useRegion()
  const location = useLocation()
  const mine = useMemo(() => loadAllLists(), [location.key])

  if (!experience) return null

  const featured = experience.storeIds.map((id) => storeMeta(id))
  const banner = occasionBanner(experience.id)

  return (
    <>
      {banner ? (
        <aside className="sale-banner">
          <strong>{banner.lead}</strong> {banner.body}{' '}
          <Link to="/new">{banner.cta}</Link>
        </aside>
      ) : null}
      <section className="hero">
        <div>
          <p className="eyebrow">Share what you actually want</p>
          <h1>Gifts without the awkward guessing.</h1>
          <p className="lede">{experience.lede}</p>
          <p>
            <Link className="btn btn-primary" to="/new">
              Start a wishlist
            </Link>{' '}
            <Link className="btn btn-ghost" to="/how-to">
              How to use
            </Link>
          </p>
        </div>
        <div className="hero-card" aria-hidden="true">
          {experience.heroGifts.map((gift) => (
            <div className="hero-item" key={gift.title}>
              <img
                className="thumb"
                src={displayPhoto(gift.photo, 'thumb')}
                alt=""
                width={160}
                height={160}
                loading="lazy"
                decoding="async"
                fetchPriority="low"
              />
              <div>
                <strong>{gift.title}</strong>
                <div className="item-store">{gift.store}</div>
              </div>
              <span className={gift.taken ? 'pill taken' : 'pill'}>{gift.pill}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>How it works</h2>
        <StepPlayer steps={experience.steps} />
      </section>

      <section className="section">
        <h2>Stores people already shop</h2>
        <p className="lede">
          Add items from these shops — or anywhere else with a product URL.
        </p>
        <div className="store-row">
          {featured.map((s) => (
            <span className="store-chip" key={s.id}>
              <span className="dot" style={{ background: s.hue }} />
              {s.name}
            </span>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Start from an occasion</h2>
        <p className="lede">
          {experience.id === 'india' && banner
            ? 'Diwali is 8 Nov. The other lists work any time of year.'
            : 'These lists work any time of year.'}
        </p>
        <div className="idea-grid">
          {landings.map((page) => (
            <Link className="card idea-card" key={page.path} to={page.path}>
              {page.badge ? <span className="idea-badge">{page.badge}</span> : null}
              <strong>{page.nav}</strong>
              <span className="meta">{page.eyebrow}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="note">
          {experience.shopNote}
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
                    {list.occasion} · {list.items.length === 1 ? '1 item' : `${list.items.length} items`}
                  </p>
                </div>
                <span className="btn btn-ghost">Open</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="site">
        {experience.footer.includes('How to use GiftLink') ? (
          <>
            {experience.footer.split('How to use GiftLink')[0]}
            <Link to="/how-to">How to use GiftLink</Link>
            {experience.footer.split('How to use GiftLink')[1]}
          </>
        ) : (
          experience.footer
        )}
      </footer>
    </>
  )
}
