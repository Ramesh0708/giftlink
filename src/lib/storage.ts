import type { StoredList } from '../types'

const INDEX = 'giftlink:index'
const listKey = (id: string) => `giftlink:list:${id}`

export function loadIndex(): string[] {
  try {
    return JSON.parse(localStorage.getItem(INDEX) || '[]') as string[]
  } catch {
    return []
  }
}

export function loadList(id: string): StoredList | null {
  try {
    const raw = localStorage.getItem(listKey(id))
    return raw ? (JSON.parse(raw) as StoredList) : null
  } catch {
    return null
  }
}

export function saveList(list: StoredList) {
  localStorage.setItem(listKey(list.id), JSON.stringify(list))
  const ids = loadIndex()
  if (!ids.includes(list.id)) {
    localStorage.setItem(INDEX, JSON.stringify([list.id, ...ids]))
  }
}

export function removeList(id: string) {
  localStorage.removeItem(listKey(id))
  localStorage.setItem(INDEX, JSON.stringify(loadIndex().filter((x) => x !== id)))
}

export function loadAllLists(): StoredList[] {
  return loadIndex()
    .map(loadList)
    .filter((x): x is StoredList => Boolean(x))
}
