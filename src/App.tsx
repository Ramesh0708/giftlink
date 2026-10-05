import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { fetchStats, hitSite } from './lib/api'
import { shortId, uid } from './lib/ids'
import { saveList } from './lib/storage'
import Home from './pages/Home'
import Editor from './pages/Editor'
import View from './pages/View'
import HowTo from './pages/HowTo'
import type { StoredList } from './types'

function Logo() {
  return (
    <svg className="logo" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#8B2942" />
      <rect x="12" y="24" width="40" height="28" rx="4" fill="#F6EFE4" />
      <rect x="30" y="24" width="4" height="28" fill="#C4A46B" />
      <path d="M12 24h40v8H12z" fill="#5C1A2C" />
      <rect x="30" y="16" width="4" height="16" fill="#C4A46B" />
      <path d="M32 16c-6-8-14-2-10 6 4-1 8-2 10-6z" fill="#C4A46B" />
      <path d="M32 16c6-8 14-2 10 6-4-1-8-2-10-6z" fill="#E8C98A" />
    </svg>
  )
}

function NewList() {
  const navigate = useNavigate()
  useEffect(() => {
    const list: StoredList = {
      id: shortId(),
      ownerKey: uid(),
      recipient: '',
      occasion: 'Diwali 2026',
      message: 'If you were going to get me something this festive season, I’d love one of these — buy it in the Amazon/Flipkart sale if you can.',
      updatedAt: new Date().toISOString(),
      items: [],
    }
    saveList(list)
    navigate(`/me/${list.id}`, { replace: true })
  }, [navigate])
  return <p className="meta">Creating your list…</p>
}

export default function App() {
  const [visits, setVisits] = useState<number | null>(null)

  useEffect(() => {
    const key = 'giftlink:hit'
    const run = sessionStorage.getItem(key)
      ? fetchStats()
      : hitSite().then((data) => {
          sessionStorage.setItem(key, '1')
          return data
        })
    void run.then((data) => setVisits(data.visits)).catch(() => setVisits(null))
  }, [])

  return (
    <div className="wrap">
      <nav className="nav">
        <Link className="brand" to="/">
          <Logo />
          GiftLink
        </Link>
        <div className="nav-actions">
          <Link className="btn btn-ghost btn-sm" to="/how-to">
            How to use
          </Link>
          <Link className="btn btn-ghost btn-sm" to="/">
            Home
          </Link>
          <Link className="btn btn-primary btn-sm" to="/new">
            Create wishlist
          </Link>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/how-to" element={<HowTo />} />
        <Route path="/new" element={<NewList />} />
        <Route path="/me/:id" element={<Editor />} />
        <Route path="/w/:id" element={<View />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <footer className="site credits">
        {visits != null && (
          <>
            {visits.toLocaleString()} visits
            {' · '}
          </>
        )}
        Idea by <strong>Rishikesh Kunte</strong>
        {' · '}
        Built by <strong>Ramesh Choudhary</strong>
      </footer>
    </div>
  )
}
