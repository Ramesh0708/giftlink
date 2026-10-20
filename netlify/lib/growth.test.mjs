import assert from 'node:assert/strict'
import test from 'node:test'
import { amazonAffiliateUrl, amazonAssociateTag, tagAmazonLinks } from './affiliate.mjs'
import { needsShareNudge } from './nudge.mjs'
import { fieldForEvent, normalizeStats } from './stats-store.mjs'

test('an unset associate tag uses the public GiftLink tag', () => {
  const url = 'https://www.amazon.in/dp/B0CHX1W1XY'
  assert.equal(amazonAssociateTag({}, {}), 'giftlink0e-21')
  assert.equal(amazonAssociateTag({ AMAZON_ASSOCIATE_TAG: '  ' }, {}), 'giftlink0e-21')
  assert.equal(amazonAssociateTag({ AMAZON_ASSOCIATE_TAG: 'bad tag' }, {}), 'giftlink0e-21')
  assert.equal(amazonAssociateTag({ AMAZON_ASSOCIATE_TAG: 'custom-21' }, {}), 'custom-21')
  assert.equal(amazonAffiliateUrl(url, ''), url)
  assert.match(amazonAffiliateUrl(url, amazonAssociateTag({}, {})), /tag=giftlink0e-21/)
})

test('amazon.in buy links gain a tag and other shops do not', () => {
  const tagged = amazonAffiliateUrl('https://www.amazon.in/dp/B0CHX1W1XY?ref=sr', 'giftlink-21')
  assert.match(tagged, /[?&]tag=giftlink-21/)
  assert.equal(
    amazonAffiliateUrl('https://www.amazon.in/dp/B0CHX1W1XY?tag=already-21', 'giftlink-21'),
    'https://www.amazon.in/dp/B0CHX1W1XY?tag=already-21',
  )
  assert.equal(amazonAffiliateUrl('https://www.amazon.com/dp/B0CHX1W1XY', 'giftlink-21'), 'https://www.amazon.com/dp/B0CHX1W1XY')
  assert.equal(
    amazonAffiliateUrl('https://www.flipkart.com/boat/p/itm123', 'giftlink-21'),
    'https://www.flipkart.com/boat/p/itm123',
  )
  const list = tagAmazonLinks(
    { items: [{ url: 'https://www.amazon.in/dp/B0CHX1W1XY' }, { url: 'https://www.flipkart.com/x/p/itm1' }] },
    'giftlink-21',
  )
  assert.match(list.items[0].url, /tag=giftlink-21/)
  assert.equal(list.items[1].url, 'https://www.flipkart.com/x/p/itm1')
})

test('the share nudge appears only after a day with zero opens', () => {
  const start = '2026-10-01T00:00:00.000Z'
  const later = Date.parse('2026-10-02T00:00:00.000Z')
  assert.equal(needsShareNudge({ published: true, publishedAt: start, opens: 0 }, later), true)
  assert.equal(needsShareNudge({ published: true, publishedAt: start, opens: 1 }, later), false)
  assert.equal(needsShareNudge({ published: true, publishedAt: start, opens: 0 }, Date.parse(start) + 1000), false)
  assert.equal(needsShareNudge({ publishedAt: start, opens: 0 }, later), true)
})

test('stats keep the original counters and add funnel fields', () => {
  assert.deepEqual(normalizeStats({ visits: 150, lists: 4, opens: 0 }), {
    visits: 150,
    lists: 4,
    opens: 0,
    created: 0,
    items: 0,
    published: 0,
    shares: 0,
    claims: 0,
    buyClicks: 0,
    refSignups: 0,
  })
  assert.equal(fieldForEvent('visits'), 'visits')
  assert.equal(fieldForEvent('share'), 'shares')
  assert.equal(fieldForEvent('buy'), 'buyClicks')
  assert.equal(fieldForEvent('ref'), 'refSignups')
  assert.equal(fieldForEvent('nope'), '')
})
