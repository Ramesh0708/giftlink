import assert from 'node:assert/strict'
import test from 'node:test'
import { confettiKind, shouldSealEnvelope, stepToss, themeForOccasion } from './delight.mjs'

test('occasion themes match the list title and fall back otherwise', () => {
  assert.equal(themeForOccasion('Diwali 2026'), 'diwali')
  assert.equal(themeForOccasion('Wedding registry'), 'wedding')
  assert.equal(themeForOccasion('Baby shower'), 'baby')
  assert.equal(themeForOccasion('Birthday'), 'birthday')
  assert.equal(themeForOccasion('Housewarming'), 'housewarming')
  assert.equal(themeForOccasion('Griha pravesh'), 'housewarming')
  assert.equal(themeForOccasion('Secret Santa'), 'santa')
  assert.equal(themeForOccasion('Holiday 2026'), 'default')
  assert.equal(themeForOccasion(''), 'default')
})

test('confetti uses marigolds, hearts, or stars', () => {
  assert.equal(confettiKind('Diwali eve'), 'marigold')
  assert.equal(confettiKind('Mehendi wedding'), 'hearts')
  assert.equal(confettiKind('Birthday'), 'stars')
  assert.equal(confettiKind('Secret Santa'), 'stars')
})

test('the envelope shows once, and skips motion, bots, and repeat visits', () => {
  assert.equal(shouldSealEnvelope({ seen: false, reducedMotion: false, userAgent: 'Mozilla/5.0' }), true)
  assert.equal(shouldSealEnvelope({ seen: true, reducedMotion: false, userAgent: 'Mozilla/5.0' }), false)
  assert.equal(shouldSealEnvelope({ seen: false, reducedMotion: true, userAgent: 'Mozilla/5.0' }), false)
  assert.equal(shouldSealEnvelope({ seen: false, reducedMotion: false, userAgent: 'Mozilla/5.0', webdriver: true }), false)
  assert.equal(
    shouldSealEnvelope({ seen: false, reducedMotion: false, userAgent: 'facebookexternalhit/1.1' }),
    false,
  )
  assert.equal(
    shouldSealEnvelope({
      seen: false,
      reducedMotion: false,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
    }),
    true,
  )
})

test('a tossed card slows down and stays near the desk', () => {
  const first = stepToss({ x: 0, y: 0, r: 0, vx: 20, vy: -8, vr: 4 })
  assert.ok(first.pose.x > 0)
  assert.equal(first.settled, false)
  const edge = stepToss({ x: 170, y: 0, r: 0, vx: 30, vy: 0, vr: 0 })
  assert.ok(edge.pose.x <= 180)
  let pose = { x: 0, y: 0, r: 0, vx: 0.05, vy: 0.05, vr: 0.02 }
  const done = stepToss(pose)
  assert.equal(done.settled, true)
})
