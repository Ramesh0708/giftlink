import { getStore } from '@netlify/blobs'

export function emptyStats() {
  return { visits: 0, lists: 0, opens: 0 }
}

export async function readStats() {
  const store = getStore('stats')
  return (await store.get('global', { type: 'json' })) || emptyStats()
}

export async function bumpStat(field) {
  const stats = await readStats()
  stats[field] = (stats[field] || 0) + 1
  const store = getStore('stats')
  await store.setJSON('global', stats)
  return stats
}
