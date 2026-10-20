type LandingPoint = { h: string; p: string }

type LandingPage = {
  path: string
  nav: string
  badge: string
  title: string
  description: string
  eyebrow: string
  h1: string
  lede: string
  points: LandingPoint[]
}

declare module '*.mjs' {
  export const landings: LandingPage[]
  export function occasionBanner(
    region: string,
    now?: Date,
  ): { lead: string; body: string; cta: string } | null
  export function themeForOccasion(occasion: string): string
  export function confettiKind(occasion: string): 'marigold' | 'hearts' | 'stars'
  export function shouldSealEnvelope(input: {
    seen?: boolean
    reducedMotion?: boolean
    userAgent?: string
    webdriver?: boolean
  }): boolean
  export function envelopeKey(id: string): string
  export function stepToss(pose: {
    x: number
    y: number
    r: number
    vx: number
    vy: number
    vr: number
  }): {
    pose: { x: number; y: number; r: number; vx: number; vy: number; vr: number }
    settled: boolean
  }
  export function needsShareNudge(
    list: { published?: boolean; publishedAt?: string | null; updatedAt?: string; opens?: number },
    now?: number,
  ): boolean
}
