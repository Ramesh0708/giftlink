export function publicShareUrl(origin: string, id: string) {
  return `${origin}/s/${id}`
}

export function shareCopy(shareUrl: string, recipient = '') {
  const who = recipient.trim() || 'me'
  return `🎁 Here’s a GiftLink for ${who} — pick a gift so nobody guesses (or doubles up).\n${shareUrl}`
}

export function forwardCopy(shareUrl: string, recipient = '', occasion = '') {
  const who = recipient.trim() || 'this'
  const when = occasion.trim() ? ` (${occasion.trim()})` : ''
  return `Looking at ${who}’s GiftLink${when} — claim one so we don’t double-buy.\n${shareUrl}`
}

export function whatsappShareUrl(shareUrl: string, recipient = '') {
  return `https://wa.me/?text=${encodeURIComponent(shareCopy(shareUrl, recipient))}`
}

export function whatsappForwardUrl(shareUrl: string, recipient = '', occasion = '') {
  return `https://wa.me/?text=${encodeURIComponent(forwardCopy(shareUrl, recipient, occasion))}`
}
