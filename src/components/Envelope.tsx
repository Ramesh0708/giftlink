import { useEffect, useRef } from 'react'

export default function Envelope({
  name,
  occasion,
  opening,
  onOpen,
  onSkip,
}: {
  name: string
  occasion: string
  opening: boolean
  onOpen: () => void
  onSkip: () => void
}) {
  const openRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    openRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onSkip()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onSkip])

  return (
    <div className={opening ? 'envelope-back is-opening' : 'envelope-back'} role="presentation">
      <div
        className="envelope-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="envelope-title"
      >
        <button ref={openRef} type="button" className="envelope" onClick={onOpen}>
          <span className="envelope-flap" aria-hidden="true" />
          <span className="wax" aria-hidden="true">
            <svg viewBox="0 0 32 32">
              <path d="M8 14 h16 v8 a2 2 0 0 1 -2 2 h-12 a2 2 0 0 1 -2 -2 z" fill="#fff8ee" />
              <path d="M8 14 l8 -6 l8 6" fill="none" stroke="#fff8ee" strokeWidth="2" />
            </svg>
          </span>
          <span className="envelope-kicker">{occasion || 'A wishlist'}</span>
          <span className="envelope-title" id="envelope-title">
            Gifts for {name || 'someone lovely'}
          </span>
          <span className="envelope-hint">Tap to open</span>
        </button>
        <button type="button" className="envelope-skip" onClick={onSkip}>
          Skip
        </button>
      </div>
    </div>
  )
}
