export const DAY_MS = 24 * 60 * 60 * 1000

export function needsShareNudge(list, now = Date.now()) {
  if (!list || (!list.published && !list.publishedAt)) return false
  if ((Number(list.opens) || 0) > 0) return false
  const start = Date.parse(list.publishedAt || list.updatedAt || '')
  if (!Number.isFinite(start)) return false
  return now - start >= DAY_MS
}

export function needsPublishBanner(list, pendingShare = false) {
  const count = Array.isArray(list?.items) ? list.items.length : 0
  if (count < 1) return false
  if (!list.published) return true
  return Boolean(pendingShare)
}
