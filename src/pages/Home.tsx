import { useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, useAnimation, useReducedMotion } from 'framer-motion'
import StepPlayer from '../components/StepPlayer'
import { storeMeta } from '../data/stores'
import { useRegion } from '../lib/region-context'
import { loadAllLists } from '../lib/storage'

export default function Home() {
  const { experience } = useRegion()
  const location = useLocation()
  const mine = useMemo(() => loadAllLists(), [location.key])
  const reduce = useReducedMotion()
  const card = useAnimation()

  useEffect(() => {
    if (reduce) return
    let live = true
    void card
      .start({ opacity: 1, y: 0, transition: { duration: 0.55, delay: 0.12, ease: 'easeOut' } })
      .then(() => {
        if (!live) return
        return card.start({
          y: [0, -8, 0],
          transition: { duration: 5.5, repeat: Infinity, ease: 'easeInOut' },
        })
      })
    return () => {
      live = false
    }
  }, [card, reduce])

  if (!experience) return null

  const featured = experience.storeIds.map((id) => storeMeta(id))

  return (
    <>
      <aside className="sale-banner">
        <strong>{experience.bannerLead}</strong> {experience.bannerBody}{' '}
        <Link to="/new">{experience.bannerCta}</Link>
      </aside>
      <section className="hero">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
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
        </motion.div>
        <motion.div
          className="hero-card"
          aria-hidden="true"
          initial={reduce ? false : { opacity: 0, y: 22 }}
          animate={reduce ? { opacity: 1, y: 0 } : card}
        >
          {experience.heroGifts.map((gift, index) => (
            <motion.div
              className="hero-item"
              key={gift.title}
              initial={reduce ? false : { opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.28 + index * 0.1, ease: 'easeOut' }}
            >
              <img className="thumb" src={gift.photo} alt="" />
              <div>
                <strong>{gift.title}</strong>
                <div className="item-store">{gift.store}</div>
              </div>
              <span className={gift.taken ? 'pill taken' : 'pill'}>{gift.pill}</span>
            </motion.div>
          ))}
        </motion.div>
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
          {featured.map((s, index) => (
            <motion.span
              className="store-chip"
              key={s.id}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
            >
              <span className="dot" style={{ background: s.hue }} />
              {s.name}
            </motion.span>
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
