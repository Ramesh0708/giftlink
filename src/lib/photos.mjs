const LOCAL = /^\/photos\/(headphones|hoodie|tawa)\.jpe?g$/

export function displayPhoto(url, kind) {
  const match = String(url || '').match(LOCAL)
  if (!match) return url || ''
  const size = kind === 'thumb' ? '160' : '800'
  return `/photos/${match[1]}-${size}.webp`
}
