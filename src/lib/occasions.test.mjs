import assert from 'node:assert/strict'
import test from 'node:test'
import { blackFriday, occasionBanner } from './occasions.mjs'

const noon = (iso) => new Date(`${iso}T12:00:00Z`)

test('Black Friday is the day after the fourth Thursday in November', () => {
  assert.deepEqual(blackFriday(2026), { year: 2026, month: 11, day: 27 })
  assert.deepEqual(blackFriday(2027), { year: 2027, month: 11, day: 26 })
})

test('India on 20 Oct 2026 sees the Diwali countdown and no sale start dates', () => {
  const banner = occasionBanner('india', noon('2026-10-20'))
  assert.equal(banner.lead, 'Diwali is 8 Nov — less than 3 weeks away.')
  assert.equal(
    banner.body,
    "Amazon's Great Indian Festival deals run till Diwali. Make your list now so family can grab your gifts at sale price — not guess at the last minute.",
  )
  assert.equal(banner.cta, 'Make a Diwali list')
  assert.doesNotMatch(banner.lead + banner.body, /8 Oct|9 Oct|Big Billion|Flipkart/)
})

test('the India banner stays through 9 Nov and is gone on 10 Nov', () => {
  assert.equal(occasionBanner('india', noon('2026-11-08')).lead, 'Diwali is today.')
  assert.equal(occasionBanner('india', noon('2026-11-09')).lead, 'Diwali was yesterday.')
  assert.equal(occasionBanner('india', noon('2026-11-10')), null)
  assert.equal(occasionBanner('india', new Date('2026-11-09T19:00:00Z')), null)
})

test('other regions are hidden on 20 Oct 2026 and never use India sale copy', () => {
  for (const region of ['americas', 'emea', 'apac']) {
    assert.equal(occasionBanner(region, noon('2026-10-20')), null)
  }
})

test('Americas and EMEA show a computed Black Friday banner only inside 21 days', () => {
  const early = occasionBanner('americas', noon('2026-11-05'))
  assert.equal(early, null)
  const americas = occasionBanner('americas', noon('2026-11-06'))
  assert.equal(americas.lead, 'Black Friday is 27 Nov — 3 weeks away.')
  assert.match(americas.body, /Amazon, Target, or Walmart/)
  assert.doesNotMatch(americas.body, /Flipkart|Diwali|amazon\.in|Big Billion/)
  const emea = occasionBanner('emea', noon('2026-11-06'))
  assert.match(emea.body, /John Lewis/)
  assert.doesNotMatch(emea.body, /Flipkart|Diwali|Target|Walmart/)
  assert.equal(occasionBanner('americas', noon('2026-11-28')), null)
  const nextYear = occasionBanner('americas', noon('2027-11-05'))
  assert.equal(nextYear.lead, 'Black Friday is 26 Nov — 3 weeks away.')
})

test('Christmas replaces Black Friday inside the 21 days before 25 Dec', () => {
  assert.equal(occasionBanner('emea', noon('2026-12-03')), null)
  const emea = occasionBanner('emea', noon('2026-12-04'))
  assert.equal(emea.lead, 'Christmas is 25 Dec — 3 weeks away.')
  assert.equal(emea.cta, 'Start a Christmas list')
  assert.equal(occasionBanner('americas', noon('2026-12-25')).lead, 'Christmas is today.')
  assert.equal(occasionBanner('americas', noon('2026-12-26')), null)
})

test('APAC uses 11 November and hides outside the same 21-day window', () => {
  assert.equal(occasionBanner('apac', noon('2026-10-20')), null)
  const banner = occasionBanner('apac', noon('2026-10-21'))
  assert.equal(banner.lead, '11.11 is 11 Nov — 3 weeks away.')
  assert.doesNotMatch(banner.body, /Flipkart|Diwali|Big Billion|8 Oct/)
  assert.equal(occasionBanner('apac', noon('2026-11-12')), null)
})
