import { useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, useAnimation, useReducedMotion } from 'framer-motion'
import StepPlayer from '../components/StepPlayer'
import { STORES } from '../data/stores'
import { loadAllLists } from '../lib/storage'

const HOW_STEPS = [
  {
    title: 'Connect Amazon or Flipkart',
    body: 'Link a shared wishlist from Amazon or Flipkart, pick the gifts you want, then add them here. Or paste a single product link.',
  },
  {
    title: 'Share one link',
    body: 'Send it to family or the group chat. They see the list without needing an account.',
  },
  {
    title: 'They claim a gift',
    body: 'A friend taps “I’ll get this” so two people don’t buy the same thing. You won’t see who claimed it.',
  },
]

const HERO_GIFTS = [
  {
    title: 'Noise-cancelling headphones',
    store: 'Amazon',
    photo: '/photos/headphones.jpg',
    pill: '₹7,999',
  },
  {
    title: 'Forest green hoodie',
    store: 'Myntra',
    photo: '/photos/hoodie.jpg',
    pill: 'Riya’s getting this',
    taken: true,
  },
  {
    title: 'Cast iron dosa tawa',
    store: 'Flipkart',
    photo: '/photos/tawa.jpg',
    pill: '₹1,249',
  },
]

export default function Home() {
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

  return (
    <>
      <aside className="sale-banner">
        <strong>Sale week is here.</strong> Amazon Great Indian Festival opens 8
        Oct (Prime 7 Oct). Flipkart Big Billion Days opens 9 Oct (Plus 8 Oct).
        Add gifts now so people can buy at sale price — not guess on Diwali
        (8 Nov).
        <Link to="/new">Make a Diwali list</Link>
      </aside>
      <section className="hero">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <p className="eyebrow">Share what you actually want</p>
          <h1>Gifts without the awkward guessing.</h1>
          <p className="lede">
            Build a wishlist from Amazon, Flipkart, Myntra, and anywhere you shop.
            Connect a shared store list, send one WhatsApp link, and friends can
            reserve a gift so nobody doubles up.
          </p>
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
          {HERO_GIFTS.map((gift, index) => (
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
        <StepPlayer steps={HOW_STEPS} />
      </section>

      <section className="section">
        <h2>Stores people already shop</h2>
        <p className="lede">
          Add items from these shops — or anywhere else with a product URL.
        </p>
        <div className="store-row">
          {STORES.filter((s) => s.id !== 'other').map((s, index) => (
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
        Stuck? Read <Link to="/how-to">How to use GiftLink</Link> — three minutes,
        then send one WhatsApp message.
      </footer>
    </>
  )
}
