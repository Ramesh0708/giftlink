import { confettiKind } from './delight.mjs'

type ConfettiShape = unknown
type ConfettiFn = ((opts?: Record<string, unknown>) => Promise<null> | null) & {
  shapeFromPath?: (path: string | { path: string }) => ConfettiShape
}

const COLORS = {
  marigold: ['#ff8a00', '#ffb703', '#e85d04', '#9b2226', '#ffe66d'],
  hearts: ['#9b2242', '#e07a9a', '#f2c14e', '#7a1f3d'],
  stars: ['#f2b6c4', '#f0d56a', '#8ecfb8', '#c9b6e4', '#8b2942'],
}

const PATHS = {
  marigold: 'M10 2 C12 6 16 7 18 7 C16 9 13 12 10 18 C7 12 4 9 2 7 C4 7 8 6 10 2 Z',
  diya: 'M3 12 Q10 4 17 12 Q15 18 10 18 Q5 18 3 12 Z M10 12 C10 7 13 6 10 1 C7 6 10 7 10 12 Z',
  heart: 'M10 6 C10 6 8 2 5 2 C2 2 0 4 0 7 C0 12 4 14 10 20 C16 14 20 12 20 7 C20 4 18 2 15 2 C12 2 10 6 10 6 Z',
}

function shapesFor(confetti: ConfettiFn, kind: 'marigold' | 'hearts' | 'stars') {
  if (kind === 'stars' || typeof confetti.shapeFromPath !== 'function') return ['star']
  try {
    if (kind === 'marigold') {
      return [confetti.shapeFromPath(PATHS.marigold), confetti.shapeFromPath(PATHS.diya)]
    }
    return [confetti.shapeFromPath(PATHS.heart)]
  } catch {
    return ['star']
  }
}

export async function burstFrom(origin: { x: number; y: number }, occasion: string) {
  const kind = confettiKind(occasion)
  const mod = await import('canvas-confetti')
  const confetti = mod.default as ConfettiFn
  const shapes = shapesFor(confetti, kind)
  await confetti({
    particleCount: kind === 'stars' ? 70 : 46,
    spread: 68,
    startVelocity: 28,
    gravity: 0.9,
    scalar: 1.05,
    ticks: 140,
    origin,
    shapes,
    colors: COLORS[kind],
    disableForReducedMotion: true,
  })
}
