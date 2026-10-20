import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'
import { shareTitle } from './share-card.mjs'

function xml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function clip(value, max) {
  const chars = Array.from(String(value || '').replace(/\s+/g, ' ').trim())
  if (chars.length <= max) return chars.join('')
  return `${chars.slice(0, max - 1).join('')}…`
}

function fontFile() {
  const candidates = [
    fileURLToPath(new URL('../fonts/Nunito-Bold.ttf', import.meta.url)),
    path.resolve('netlify/fonts/Nunito-Bold.ttf'),
    '/var/task/netlify/fonts/Nunito-Bold.ttf',
  ]
  const found = candidates.find((candidate) => fs.existsSync(candidate))
  if (!found) throw new Error('GiftLink font missing')
  return found
}

function isPublicImage(raw) {
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:') return false
    const host = url.hostname.toLowerCase()
    if (
      host === 'localhost' ||
      host.endsWith('.local') ||
      /^(127\.|10\.|192\.168\.|169\.254\.)/.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    ) {
      return false
    }
    return true
  } catch {
    return false
  }
}

async function defaultLoadImage(url) {
  if (!isPublicImage(url)) return ''
  const res = await fetch(url, {
    headers: { Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8' },
    signal: AbortSignal.timeout(4000),
  })
  if (!res.ok) return ''
  const type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
  if (!/^image\/(png|jpe?g|webp|gif)$/.test(type)) return ''
  const bytes = Buffer.from(await res.arrayBuffer())
  if (bytes.length < 400 || bytes.length > 1_800_000) return ''
  return `data:${type};base64,${bytes.toString('base64')}`
}

function cardSvg({ title, subtitle, images }) {
  const thumbs = images.slice(0, 3).map((href, index) => {
    const x = 72 + index * 210
    return `<clipPath id="thumb${index}"><rect x="${x}" y="360" width="188" height="188" rx="28"/></clipPath>
      <image href="${xml(href)}" x="${x}" y="360" width="188" height="188" preserveAspectRatio="xMidYMid slice" clip-path="url(#thumb${index})"/>`
  })
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f6efe4"/>
  <rect width="1200" height="18" fill="#8b2942"/>
  <text x="72" y="110" font-family="Nunito" font-size="28" fill="#8b2942">GIFTLINK</text>
  <text x="72" y="210" font-family="Nunito" font-size="68" fill="#2b1810">${xml(clip(title, 32))}</text>
  <text x="72" y="280" font-family="Nunito" font-size="32" fill="#6d564b">${xml(clip(subtitle, 56))}</text>
  ${thumbs.join('\n')}
</svg>`
}

export async function renderShareImage(list, deps = {}) {
  const loadImage = deps.loadImage || defaultLoadImage
  const title = shareTitle(list)
  const count = list.items?.length || 0
  const occasion = list.occasion?.trim()
  const subtitle = [
    occasion && title.startsWith(occasion) ? '' : occasion,
    count === 1 ? '1 gift' : `${count} gifts`,
  ]
    .filter(Boolean)
    .join(' · ')
  const urls = (list.items || []).map((item) => item.image).filter(Boolean).slice(0, 3)
  const images = (
    await Promise.all(urls.map((url) => loadImage(url).catch(() => '')))
  ).filter(Boolean)
  const svg = cardSvg({ title, subtitle: subtitle || 'A shared wishlist', images })
  const resvg = new Resvg(svg, {
    font: {
      fontFiles: [fontFile()],
      loadSystemFonts: false,
      defaultFontFamily: 'Nunito',
    },
  })
  return resvg.render().asPng()
}
