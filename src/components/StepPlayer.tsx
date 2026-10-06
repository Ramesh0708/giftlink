import { useEffect, useState } from 'react'

const STEP_MS = 4200

export type Step = {
  title: string
  body: string
}

export default function StepPlayer({ steps }: { steps: Step[] }) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const step = steps[index]

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motion.matches) setPlaying(false)
  }, [])

  useEffect(() => {
    if (!playing || steps.length < 2) return
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % steps.length)
    }, STEP_MS)
    return () => window.clearTimeout(timer)
  }, [playing, index, steps.length])

  if (!step) return null

  return (
    <div className="step-player">
      <div className="step-track">
        <button
          type="button"
          className="step-play"
          aria-label={playing ? 'Pause steps' : 'Play steps'}
          onClick={() => setPlaying((on) => !on)}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        {steps.map((item, i) => (
          <button
            type="button"
            key={item.title}
            className={i === index ? 'step-pip on' : 'step-pip'}
            aria-label={`Step ${i + 1}: ${item.title}`}
            aria-current={i === index ? 'step' : undefined}
            onClick={() => {
              setIndex(i)
              setPlaying(false)
            }}
          >
            {i === index && playing && <span className="step-fill" />}
          </button>
        ))}
      </div>
      <p className="meta step-count">
        Step {index + 1} of {steps.length}
      </p>
      <article className="card step-card">
        <div className="step-num">{index + 1}</div>
        <h3>{step.title}</h3>
        <p className="meta">{step.body}</p>
      </article>
    </div>
  )
}
