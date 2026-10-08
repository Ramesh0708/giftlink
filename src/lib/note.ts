import type { RegionId } from '../data/regions'

const INDIA_ME =
  'If you were going to get me something this festive season, I’d love one of these — buy it in the Amazon/Flipkart sale if you can.'

const INDIA_NAMED =
  /^If you were going to get .+ something this festive season, they.d love one of these — buy it in the Amazon\/Flipkart sale if you can\.$/

type NoteSet = {
  me: string
  named: (who: string) => string
  pattern: RegExp
}

const NOTES: Record<RegionId, NoteSet> = {
  india: {
    me: INDIA_ME,
    named: (who) => {
      const apostrophe = INDIA_ME.match(/I(.)d love/)?.[1] || "'"
      return `If you were going to get ${who} something this festive season, they${apostrophe}d love one of these — buy it in the Amazon/Flipkart sale if you can.`
    },
    pattern: INDIA_NAMED,
  },
  americas: {
    me: 'If you were going to get me something, I’d love one of these — a holiday gift, Secret Santa, or just because.',
    named: (who) =>
      `If you were going to get ${who} something, they’d love one of these — a holiday gift, Secret Santa, or just because.`,
    pattern:
      /^If you were going to get .+ something, they.d love one of these — a holiday gift, Secret Santa, or just because\.$/,
  },
  emea: {
    me: 'If you were going to get me something, I’d love one of these — for Christmas, a birthday, or just because.',
    named: (who) =>
      `If you were going to get ${who} something, they’d love one of these — for Christmas, a birthday, or just because.`,
    pattern:
      /^If you were going to get .+ something, they.d love one of these — for Christmas, a birthday, or just because\.$/,
  },
  apac: {
    me: 'If you were going to get me something, I’d love one of these — for year-end, a birthday, or just because.',
    named: (who) =>
      `If you were going to get ${who} something, they’d love one of these — for year-end, a birthday, or just because.`,
    pattern:
      /^If you were going to get .+ something, they.d love one of these — for year-end, a birthday, or just because\.$/,
  },
}

export function defaultNote(name: string, region: RegionId = 'india') {
  const note = NOTES[region]
  const who = name.trim()
  if (!who) return note.me
  return note.named(who)
}

export function stockRegion(message: string): RegionId | null {
  const text = message.trim()
  if (!text) return null
  for (const id of Object.keys(NOTES) as RegionId[]) {
    const note = NOTES[id]
    if (text === note.me || note.pattern.test(text)) return id
  }
  return null
}

export function isStockNote(message: string) {
  const text = message.trim()
  if (!text) return true
  return stockRegion(text) != null
}

export function displayNote(message: string, name: string) {
  if (isStockNote(message)) return defaultNote(name, stockRegion(message) ?? 'india')
  return message
}
