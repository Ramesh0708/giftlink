declare module 'canvas-confetti' {
  interface ConfettiOptions {
    particleCount?: number
    spread?: number
    startVelocity?: number
    gravity?: number
    scalar?: number
    ticks?: number
    origin?: { x?: number; y?: number }
    shapes?: unknown[]
    colors?: string[]
    disableForReducedMotion?: boolean
  }
  interface Confetti {
    (options?: ConfettiOptions): Promise<null> | null
    shapeFromPath: (path: string | { path: string }) => unknown
  }
  const confetti: Confetti
  export default confetti
}
