import { Link } from 'react-router-dom'
import { useRegion } from '../lib/region-context'

export default function HowTo() {
  const { experience } = useRegion()
  if (!experience) return null

  return (
    <section className="section">
      <p className="eyebrow">Simple walkthrough</p>
      <h1>How to use GiftLink</h1>
      <p className="lede">{experience.howtoLede}</p>

      <div className="guide-steps">
        <article className="card">
          <div className="step-num">1</div>
          <h3>Create your list</h3>
          <p className="meta">
            Tap <strong>Create wishlist</strong>. Type your name and the occasion
            ({experience.howtoOccasion}). This page is only on your phone —
            friends never see the editor.
          </p>
        </article>

        <article className="card">
          <div className="step-num">2</div>
          <h3>Add gifts (easiest way)</h3>
          <p className="meta">
            Open {experience.howtoShops}. Copy the product link from the address
            bar. Tap <strong>Add gift</strong>, paste the link, wait a moment for
            the name and photo, then save.
          </p>
          <p className="meta">
            Tip: paste the full <code>https://</code> product page, not a search
            results page.
          </p>
        </article>

        <article className="card">
          <div className="step-num">3</div>
          <h3>
            {experience.showFlipkart
              ? 'Or connect a whole Amazon / Flipkart list'
              : 'Or connect a whole Amazon list'}
          </h3>
          <p className="meta">Those shops don’t let apps log into your account. Instead:</p>
          <ol className="guide-ol">
            <li>
              Amazon: Wish List → your list → <strong>Share</strong> → Anyone with
              the link → copy.
            </li>
            {experience.showFlipkart && (
              <li>
                Flipkart: Wishlist → <strong>Share</strong>. If that fails, copy a
                few product links instead.
              </li>
            )}
            <li>
              In GiftLink tap <strong>Connect Amazon</strong>
              {experience.showFlipkart ? (
                <>
                  {' '}
                  or <strong>Connect Flipkart</strong>
                </>
              ) : null}
              , paste, fetch, tick the items you want.
            </li>
          </ol>
        </article>

        <article className="card">
          <div className="step-num">4</div>
          <h3>Publish and send the share link</h3>
          <p className="meta">{experience.howtoSend}</p>
        </article>

        <article className="card">
          <div className="step-num">5</div>
          <h3>What friends do</h3>
          <p className="meta">
            They type their name, tap <strong>I’ll get this</strong> so nobody
            else picks the same gift, then tap <strong>{experience.howtoBuy}</strong>.
            You won’t see who claimed it, so the surprise stays.
          </p>
        </article>
      </div>

      <p style={{ marginTop: 28 }}>
        <Link className="btn btn-primary" to="/new">
          Create my wishlist
        </Link>{' '}
        <Link className="btn btn-ghost" to="/">
          Back home
        </Link>
      </p>
    </section>
  )
}
