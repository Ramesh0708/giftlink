import { Link, Navigate, useLocation } from 'react-router-dom'
import { landings, withTrailingSlash } from '../data/landings.mjs'

export default function Landing() {
  const { pathname } = useLocation()
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  const page = landings.find((item) => item.path === path)
  if (!page) return <Navigate to="/" replace />

  return (
    <article className="landing">
      <p className="eyebrow">{page.eyebrow}</p>
      <h1>{page.h1}</h1>
      <p className="lede">{page.lede}</p>
      <p>
        <Link className="btn btn-primary" to="/new">
          Start a wishlist
        </Link>{' '}
        <Link className="btn btn-ghost" to="/how-to">
          How to use
        </Link>
      </p>
      <div className="landing-points">
        {page.points.map((point) => (
          <section className="card" key={point.h}>
            <h2>{point.h}</h2>
            <p>{point.p}</p>
          </section>
        ))}
      </div>
      <aside className="cta-band">
        <h2>Make your own GiftLink</h2>
        <p>Add a gift from Amazon, Flipkart, or any other shop. The list goes live, then you share it on WhatsApp.</p>
        <Link className="btn" to="/new">
          Make your own GiftLink
        </Link>
      </aside>
      <p className="meta">
        <Link to="/">Back home</Link>
        {' · '}
        {landings
          .filter((item) => item.path !== page.path)
          .slice(0, 3)
          .map((item, index) => (
            <span key={item.path}>
              {index > 0 ? ' · ' : null}
              <Link to={withTrailingSlash(item.path)}>{item.nav}</Link>
            </span>
          ))}
      </p>
    </article>
  )
}
