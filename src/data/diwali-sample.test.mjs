import assert from 'node:assert/strict'
import test from 'node:test'
import { diwaliSampleItems } from './diwali-sample.mjs'

test('the sample Diwali list is five Amazon.in gifts with the affiliate tag', () => {
  const items = diwaliSampleItems()
  assert.equal(items.length, 5)
  for (const item of items) {
    assert.ok(item.title.length > 3)
    assert.ok(item.price >= 1)
    assert.equal(item.currency, 'INR')
    assert.equal(item.store, 'amazon')
    assert.match(item.url, /^https:\/\/www\.amazon\.in\/dp\/[A-Z0-9]{10}\?tag=giftlink0e-21$/)
  }
  assert.equal(new Set(items.map((item) => item.url)).size, 5)
})
