import assert from 'node:assert/strict'
import test from 'node:test'
import { mergeItems, nextStoredList, noteOpen, presentList, reserve, unreserve } from './wishlist-access.mjs'

function sample() {
  return {
    id: 'list1',
    ownerKey: 'owner-secret',
    recipient: 'Priya',
    occasion: 'Diwali',
    message: 'hi',
    updatedAt: '2026-01-01T00:00:00.000Z',
    links: [{ store: 'amazon', url: 'https://amazon.in/hz/wishlist/ls/1', name: 'Priya', linkedAt: '2026-01-01' }],
    items: [
      { id: 'a', title: 'Mug', url: '', image: '', price: 100, reservedBy: 'Arjun', claimToken: 'token-claim-1' },
      { id: 'b', title: 'Book', url: '', image: '', price: null, reservedBy: null, claimToken: null },
    ],
  }
}

test('public lists hide claimer names and tokens', () => {
  const pub = presentList(sample(), { tokens: new Set(['token-claim-1']) })
  const encoded = JSON.stringify(pub)
  assert.equal(encoded.includes('Arjun'), false)
  assert.equal(encoded.includes('token-claim-1'), false)
  assert.equal(encoded.includes('owner-secret'), false)
  assert.equal(pub.links, undefined)
  assert.equal(pub.items[0].claimed, true)
  assert.equal(pub.items[0].mine, true)
  assert.equal(pub.items[1].claimed, false)
  assert.equal(pub.items[1].mine, false)
})

test('a stranger does not see someone else’s claim as theirs', () => {
  const pub = presentList(sample())
  assert.equal(pub.items[0].mine, false)
  assert.equal(pub.items[0].claimed, true)
})

test('legacy claims stay claimed and cannot be cleared by name', () => {
  const list = sample()
  delete list.items[0].claimToken
  assert.equal(presentList(list).items[0].claimed, true)
  assert.throws(() => unreserve(list, { itemId: 'a', token: 'Arjun' }), /undo/)
  assert.equal(list.items[0].reservedBy, 'Arjun')
})

test('unreserve requires the claim token', () => {
  const list = sample()
  assert.throws(() => unreserve(list, { itemId: 'a', token: 'nope-token' }), /undo/)
  unreserve(list, { itemId: 'a', token: 'token-claim-1' })
  assert.equal(list.items[0].reservedBy, null)
  assert.equal(list.items[0].claimToken, null)
})

test('reserve stores a token the public payload does not echo inside items', () => {
  const list = sample()
  const token = reserve(list, { itemId: 'b', name: 'Meera' })
  const pub = presentList(list, { tokens: new Set([token]) })
  assert.equal(JSON.stringify(pub).includes('Meera'), false)
  assert.equal(JSON.stringify(pub).includes(token), false)
  assert.equal(pub.items[1].mine, true)
})

test('owner saves do not clear an existing claim', () => {
  const list = sample()
  const merged = mergeItems(list.items, [
    { id: 'a', title: 'Mug renamed', reservedBy: null, claimToken: null },
  ])
  assert.equal(merged[0].title, 'Mug renamed')
  assert.equal(merged[0].reservedBy, 'Arjun')
  assert.equal(merged[0].claimToken, 'token-claim-1')
})

test('a republish keeps claims, the first publish time, and referral', () => {
  const existing = sample()
  existing.publishedAt = '2026-01-01T00:00:00.000Z'
  existing.opens = 2
  const first = nextStoredList(null, { items: [{ id: 'a', title: 'Mug' }], referredBy: 'friendlist1' }, 'newlist1', 'key')
  assert.equal(first.created, true)
  assert.equal(first.added, 1)
  assert.equal(first.list.referredBy, 'friendlist1')
  assert.ok(first.list.publishedAt)
  const again = nextStoredList(
    existing,
    {
      items: [
        { id: 'a', title: 'Mug renamed' },
        { id: 'b', title: 'Book' },
        { id: 'c', title: 'Lamp' },
      ],
      referredBy: 'otherlist1',
    },
    'list1',
    'owner-secret',
  )
  assert.equal(again.created, false)
  assert.equal(again.added, 1)
  assert.equal(again.list.publishedAt, '2026-01-01T00:00:00.000Z')
  assert.equal(again.list.opens, 2)
  assert.equal(again.list.referredBy, 'otherlist1')
  existing.referredBy = 'friendlist1'
  const kept = nextStoredList(existing, { referredBy: 'otherlist1', items: existing.items }, 'list1', 'owner-secret')
  assert.equal(kept.list.referredBy, 'friendlist1')
  assert.equal(again.list.items[0].reservedBy, 'Arjun')
  noteOpen(again.list)
  assert.equal(again.list.opens, 3)
  const owner = presentList(again.list, { owner: true })
  assert.equal(owner.opens, 3)
  assert.equal(presentList(again.list).opens, undefined)
})

test('owner view includes store links and still hides names', () => {
  const owner = presentList(sample(), { owner: true })
  assert.equal(owner.links.length, 1)
  assert.equal(JSON.stringify(owner).includes('Arjun'), false)
  assert.equal(JSON.stringify(owner).includes('owner-secret'), false)
})
