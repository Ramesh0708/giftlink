export function shareCopy(shareUrl: string, recipient = '') {
  const who = recipient.trim() || 'me'
  return `Amazon/Flipkart sale starts 8–9 Oct. Here’s what I’d love for ${who} — pick one so nobody buys the same gift:\n${shareUrl}`
}

export function forwardCopy(shareUrl: string, recipient = '', occasion = '') {
  const who = recipient.trim() || 'this'
  const when = occasion.trim() ? ` ${occasion.trim()}` : ''
  return `Looking at ${who}'s${when} GiftLink — claim one so we don’t double-buy:\n${shareUrl}`
}

export function whatsappShareUrl(shareUrl: string, recipient = '') {
  return `https://wa.me/?text=${encodeURIComponent(shareCopy(shareUrl, recipient))}`
}

export function whatsappForwardUrl(shareUrl: string, recipient = '', occasion = '') {
  return `https://wa.me/?text=${encodeURIComponent(forwardCopy(shareUrl, recipient, occasion))}`
}
