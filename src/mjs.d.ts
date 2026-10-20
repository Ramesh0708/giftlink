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
  export function needsShareNudge(
    list: { published?: boolean; publishedAt?: string | null; updatedAt?: string; opens?: number },
    now?: number,
  ): boolean
}
