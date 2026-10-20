const BOT =
  /googlebot|bingbot|baiduspider|yandex|duckduckbot|applebot|petalbot|facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|telegrambot|discordbot|embedly|pinterestbot|ia_archiver|semrush|ahrefs|dotbot/i

export function themeForOccasion(occasion) {
  const text = String(occasion || '').toLowerCase()
  if (text.includes('diwali')) return 'diwali'
  if (/wedding|shaadi|bridal|mehndi|mehendi/.test(text)) return 'wedding'
  if (/baby|newborn|shower/.test(text)) return 'baby'
  if (/birthday|bday/.test(text)) return 'birthday'
  if (text.includes('santa')) return 'santa'
  if (/housewarm|griha|new home|warming/.test(text)) return 'housewarming'
  return 'default'
}

export function confettiKind(occasion) {
  const theme = themeForOccasion(occasion)
  if (theme === 'diwali') return 'marigold'
  if (theme === 'wedding') return 'hearts'
  return 'stars'
}

export function isLikelyBot(userAgent) {
  return BOT.test(String(userAgent || ''))
}

export function shouldSealEnvelope({ seen, reducedMotion, userAgent, webdriver }) {
  if (seen || reducedMotion || webdriver) return false
  if (isLikelyBot(userAgent)) return false
  return true
}

export function envelopeKey(id) {
  return `giftlink:envelope:${id}`
}

export function stepToss(pose) {
  const next = {
    x: pose.x + pose.vx,
    y: pose.y + pose.vy,
    r: pose.r + pose.vr,
    vx: pose.vx * 0.9,
    vy: pose.vy * 0.9,
    vr: pose.vr * 0.88,
  }
  const xLimit = 180
  if (next.x > xLimit) {
    next.x = xLimit
    next.vx *= -0.35
  } else if (next.x < -xLimit) {
    next.x = -xLimit
    next.vx *= -0.35
  }
  if (next.y > 220) {
    next.y = 220
    next.vy *= -0.35
  } else if (next.y < -80) {
    next.y = -80
    next.vy *= -0.35
  }
  const settled = Math.abs(next.vx) < 0.15 && Math.abs(next.vy) < 0.15 && Math.abs(next.vr) < 0.1
  return { pose: next, settled }
}
