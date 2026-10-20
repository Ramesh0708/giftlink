export function publicShareUrl(origin: string, id: string) {
  return `${origin}/s/${id}`
}

export function ownerEditUrl(origin: string, id: string, ownerKey: string) {
  return `${origin}/me/${id}#k=${encodeURIComponent(ownerKey)}`
}

export function ownerKeyFromHash(hash: string) {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  return new URLSearchParams(raw).get('k')?.trim() || ''
}

export function shareCopy(shareUrl: string, recipient = '', occasion = '') {
  const who = recipient.trim()
  const when = occasion.trim()
  const name = who ? `${who}’s` : 'My'
  const event = when ? `${when} ` : ''
  return [
    `🎁 ${name} ${event}wishlist`,
    '',
    'This is what I’d actually love. Open the list, tap “I’ll get this” on one gift, then buy it from the link so two people don’t bring the same thing.',
    '',
    shareUrl,
  ].join('\n')
}

export function forwardCopy(shareUrl: string, recipient = '', occasion = '') {
  const who = recipient.trim() || 'someone'
  const when = occasion.trim() ? ` for ${occasion.trim()}` : ''
  return [
    `🎁 Gifts for ${who}${when}`,
    '',
    'Claim one gift so the group doesn’t double-buy, then grab it from the link.',
    '',
    shareUrl,
  ].join('\n')
}

export function whatsappShareUrl(shareUrl: string, recipient = '', occasion = '') {
  return `https://wa.me/?text=${encodeURIComponent(shareCopy(shareUrl, recipient, occasion))}`
}

export function whatsappForwardUrl(shareUrl: string, recipient = '', occasion = '') {
  return `https://wa.me/?text=${encodeURIComponent(forwardCopy(shareUrl, recipient, occasion))}`
}
