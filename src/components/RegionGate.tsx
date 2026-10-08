import { useEffect } from 'react'
import { REGIONS } from '../data/regions'
import { useRegion } from '../lib/region-context'

export default function RegionGate({ shared }: { shared: boolean }) {
  const { region, picking, choose, closePicker } = useRegion()
  const open = (!region && !shared) || picking

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && region) closePicker()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, region, closePicker])

  if (!open) return null

  return (
    <div className="modal-back region-back" role="presentation">
      <div
        className="modal region-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="region-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p className="eyebrow">Where are you shopping?</p>
            <h2 id="region-title">Choose a region</h2>
          </div>
          {region && (
            <button type="button" className="icon-btn" onClick={closePicker} aria-label="Close">
              ×
            </button>
          )}
        </div>
        <p className="lede region-lede">
          GiftLink follows this choice: stores, currency, and the occasion on a new list.
          India keeps Diwali, rupees, and Flipkart. Everyone else gets their own shops.
          You can change it later from the top bar.
        </p>
        <div className="region-grid">
          {REGIONS.map((item) => (
            <button
              type="button"
              key={item.id}
              className={item.id === region ? 'region-card on' : 'region-card'}
              onClick={() => choose(item.id)}
            >
              <span className="region-place">{item.places}</span>
              <strong>{item.name}</strong>
              <span className="meta">{item.summary}</span>
            </button>
          ))}
        </div>
        <p className="meta">
          Someone opening a shared gift link skips this and goes straight to the list.
        </p>
      </div>
    </div>
  )
}
