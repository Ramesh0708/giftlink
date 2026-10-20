const key = (id: string) => `giftlink:claims:${id}`

function read(listId: string): Record<string, string> {
  try {
    const raw = JSON.parse(localStorage.getItem(key(listId)) || '{}') as Record<string, string>
    return raw && typeof raw === 'object' ? raw : {}
  } catch {
    return {}
  }
}

export function claimTokens(listId: string) {
  return Object.values(read(listId)).filter((token) => typeof token === 'string' && token.length > 0)
}

export function claimTokenFor(listId: string, itemId: string) {
  return read(listId)[itemId] || ''
}

export function rememberClaim(listId: string, itemId: string, token: string) {
  const map = read(listId)
  map[itemId] = token
  localStorage.setItem(key(listId), JSON.stringify(map))
}

export function forgetClaim(listId: string, itemId: string) {
  const map = read(listId)
  delete map[itemId]
  localStorage.setItem(key(listId), JSON.stringify(map))
}
