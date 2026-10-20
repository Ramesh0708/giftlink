export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

const TOKEN_RE = /^[A-Za-z0-9_-]{8,80}$/

export function tokensFromHeader(value) {
  const tokens = new Set()
  for (const part of String(value || '').split(',')) {
    const token = part.trim()
    if (!TOKEN_RE.test(token)) continue
    tokens.add(token)
    if (tokens.size >= 40) break
  }
  return tokens
}

export function presentItem(item, tokens = new Set()) {
  const claimed = Boolean(item?.reservedBy || item?.claimToken)
  const mine = Boolean(item?.claimToken && tokens.has(item.claimToken))
  const rest = { ...item }
  delete rest.reservedBy
  delete rest.claimToken
  delete rest.claimed
  delete rest.mine
  return { ...rest, claimed, mine }
}

export function presentList(list, { owner = false, tokens = new Set() } = {}) {
  const items = (list.items || []).map((item) => presentItem(item, tokens))
  const base = {
    id: list.id,
    recipient: list.recipient || '',
    occasion: list.occasion || '',
    message: list.message || '',
    updatedAt: list.updatedAt,
    items,
  }
  if (owner) return { ...base, links: Array.isArray(list.links) ? list.links : [] }
  return base
}

export function mergeItems(existingItems = [], incomingItems = []) {
  return incomingItems.map((item) => {
    const prev = existingItems.find((entry) => entry && entry.id === item?.id)
    const rest = { ...(item || {}) }
    delete rest.reservedBy
    delete rest.claimToken
    delete rest.claimed
    delete rest.mine
    return {
      ...rest,
      reservedBy: prev?.reservedBy ?? null,
      claimToken: prev?.claimToken ?? null,
    }
  })
}

export function reserve(list, { itemId, name }) {
  const item = (list.items || []).find((entry) => entry.id === itemId)
  if (!item) throw new HttpError(404, 'Item not found')
  if (item.reservedBy || item.claimToken) throw new HttpError(409, 'Already reserved')
  const who = String(name || '').trim()
  if (!who) throw new HttpError(400, 'Name required')
  const token = crypto.randomUUID()
  item.reservedBy = who
  item.claimToken = token
  list.updatedAt = new Date().toISOString()
  return token
}

export function unreserve(list, { itemId, token }) {
  const item = (list.items || []).find((entry) => entry.id === itemId)
  if (!item) throw new HttpError(404, 'Item not found')
  const secret = String(token || '').trim()
  if (!item.claimToken || secret !== item.claimToken) {
    throw new HttpError(403, 'Only the person who claimed this gift can undo it')
  }
  item.reservedBy = null
  item.claimToken = null
  list.updatedAt = new Date().toISOString()
}
