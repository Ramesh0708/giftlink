import assert from 'node:assert/strict'
import test from 'node:test'
import { diwaliQuickAdds, diwaliSampleItems } from './diwali-sample.mjs'

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

test('one-tap Diwali suggestions are three tagged Amazon.in gifts', () => {
  const items = diwaliQuickAdds()
  assert.equal(items.length, 3)
  for (const item of items) {
    assert.match(item.url, /^https:\/\/www\.amazon\.in\/dp\/[A-Z0-9]{10}\?tag=giftlink0e-21$/)
  }
  assert.equal(new Set(items.map((item) => item.url)).size, 3)
  const sampleUrls = new Set(diwaliSampleItems().map((item) => item.url))
  for (const item of items) assert.equal(sampleUrls.has(item.url), true)
})
