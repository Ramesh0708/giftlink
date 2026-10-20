import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { landings } from './data/landings.mjs'
import { track } from './lib/track'
import { hitSite } from './lib/api'
import { shortId, uid } from './lib/ids'
import { defaultNote } from './lib/note'
import { useRegion } from './lib/region-context'
import { loadList, saveList } from './lib/storage'
import AnimatedCounter from './components/AnimatedCounter'
import RegionGate from './components/RegionGate'
import ScrollProgress from './components/ScrollProgress'
import type { StoredList } from './types'

const Home = lazy(() => import('./pages/Home'))
const Editor = lazy(() => import('./pages/Editor'))
const View = lazy(() => import('./pages/View'))
const HowTo = lazy(() => import('./pages/HowTo'))
const Landing = lazy(() => import('./pages/Landing'))

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

function ShareToView() {
  const { id = '' } = useParams()
  return <Navigate to={`/w/${id}`} replace />
}

function NewList() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { region, experience } = useRegion()
  useEffect(() => {
    if (!region || !experience) return
    const pending = sessionStorage.getItem('giftlink:creating')
    if (pending && loadList(pending)) {
      navigate(`/me/${pending}`, { replace: true })
      return
    }
    const ref = params.get('ref') || ''
    const referredBy = /^[a-z0-9]{6,24}$/i.test(ref) ? ref : ''
    const list: StoredList = {
      id: shortId(),
      ownerKey: uid(),
      recipient: '',
      occasion: experience.occasion,
      message: defaultNote('', region),
      updatedAt: new Date().toISOString(),
      items: [],
      referredBy: referredBy || undefined,
    }
    saveList(list)
    sessionStorage.setItem('giftlink:creating', list.id)
    track('created', { listId: list.id })
    if (referredBy) track('ref', { listId: list.id, ref: referredBy })
    navigate(`/me/${list.id}`, { replace: true })
  }, [navigate, region, experience, params])
  return <p className="meta">Creating your list…</p>
}

export default function App() {
  const [visits, setVisits] = useState<number | null>(null)
  const { experience, openPicker } = useRegion()

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('giftlink:stats')
      if (cached) setVisits(JSON.parse(cached).visits as number)
    } catch {
      /* ignore a bad cache */
    }
    if (sessionStorage.getItem('giftlink:hit')) return
    const path = window.location.pathname
    if (path.startsWith('/w/') || path.startsWith('/s/')) return
    const kick = () => {
      if (sessionStorage.getItem('giftlink:hit')) return
      void hitSite()
        .then((data) => {
          sessionStorage.setItem('giftlink:hit', '1')
          sessionStorage.setItem('giftlink:stats', JSON.stringify(data))
          setVisits(data.visits)
        })
        .catch(() => setVisits(null))
    }
    const timer = window.setTimeout(kick, 1500)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="wrap">
      <ScrollProgress />
      <nav className="nav">
        <Link className="brand" to="/">
          <Logo />
          GiftLink
        </Link>
        <div className="nav-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={openPicker}>
            {experience ? experience.name : 'Region'}
          </button>
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
      <Suspense fallback={<p className="meta">Loading…</p>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/how-to" element={<HowTo />} />
          {landings.map((page) => (
            <Route key={page.path} path={page.path} element={<Landing />} />
          ))}
          <Route path="/new" element={<NewList />} />
          <Route path="/me/:id" element={<Editor />} />
          <Route path="/w/:id" element={<View />} />
          <Route path="/s/:id" element={<ShareToView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <RegionGate />
      <footer className="site credits">
        {visits != null && (
          <>
            <AnimatedCounter value={visits} /> visits
            {' · '}
          </>
        )}
        Idea by <strong>Rishikesh Kunte</strong>
        {' · '}
        Built by <strong>Ramesh Choudhary</strong>
        <span className="associate">As an Amazon Associate, GiftLink earns from qualifying purchases.</span>
      </footer>
    </div>
  )
}
