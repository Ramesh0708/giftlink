import fs from 'node:fs'
import path from 'node:path'
import { landings } from '../src/data/landings.mjs'

const origin = (process.env.URL || 'https://wiishlist.netlify.app').replace(/\/$/, '')
const dist = path.resolve('dist')
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
if (!template.includes('content="R_MrDCaUuDRcZ3Tv2mJDmOh0th9WZMI8sY4bZ2XHJPc"')) {
  throw new Error('Built HTML is missing the Google site verification tag')
}
if (!template.includes('G-EP4MKTGEZ4') || !template.includes('googletagmanager.com/gtag/js')) {
  throw new Error('Built HTML is missing Google Analytics')
}

const home = {
  path: '/',
  title: 'GiftLink — gifts without the guessing',
  description:
    'GiftLink is a shareable wishlist so your people can gift what you actually want — from Amazon, Flipkart, and anywhere you shop.',
  body: `<main>
  <p>Share what you actually want</p>
  <h1>Gifts without the awkward guessing.</h1>
  <p>Build a wishlist from Amazon, Flipkart, Myntra, and anywhere you shop. Add a gift and the list goes live. Share one WhatsApp link, and friends can claim a gift so nobody doubles up.</p>
  <p><a href="/new">Start a wishlist</a> <a href="/how-to">How to use</a></p>
  <h2>Start from an occasion</h2>
  <ul>
    ${landings.map((page) => `<li><a href="${page.path}">${escapeHtml(page.nav)}</a> — ${escapeHtml(page.eyebrow)}</li>`).join('\n    ')}
  </ul>
  <h2>How it works</h2>
  <ol>
    <li>Paste a product link from Amazon, Flipkart, or any shop.</li>
    <li>Share on WhatsApp. The list is live as soon as the first gift is saved.</li>
    <li>A friend taps “I’ll get this” so two people don’t buy the same thing. You won’t see who claimed it.</li>
  </ol>
</main>`,
}

const howto = {
  path: '/how-to',
  title: 'How to use GiftLink',
  description:
    'Create a wishlist, paste product links, and share it on WhatsApp. Friends claim a gift so nobody doubles up.',
  body: `<main>
  <p>Simple walkthrough</p>
  <h1>How to use GiftLink</h1>
  <p>You make a list of gifts you want. Friends open one link, pick something, and buy it. Nobody has to guess — and two people won’t buy the same thing.</p>
  <h2>1. Create your list</h2>
  <p>Tap Create wishlist. Type your name and the occasion. Save the private edit link if you want to change the list from another phone.</p>
  <h2>2. Add gifts</h2>
  <p>Copy a product link from Amazon, Flipkart, or any shop. Paste it, then save. If the shop won’t share the name or price, fill those in yourself.</p>
  <h2>3. Share on WhatsApp</h2>
  <p>The list goes live when you add a gift. Tap Share on WhatsApp. Don’t send the private edit link — that’s only for you.</p>
  <h2>4. What friends do</h2>
  <p>They type their name, tap I’ll get this, then buy from the product link. Other people only see that the gift is claimed.</p>
  <p><a href="/new">Create my wishlist</a> <a href="/">Back home</a></p>
</main>`,
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function landingBody(page) {
  return `<main>
  <p>${escapeHtml(page.eyebrow)}</p>
  <h1>${escapeHtml(page.h1)}</h1>
  <p>${escapeHtml(page.lede)}</p>
  <p><a href="/new">Start a wishlist</a></p>
  ${page.points
    .map((point) => `<h2>${escapeHtml(point.h)}</h2>\n  <p>${escapeHtml(point.p)}</p>`)
    .join('\n  ')}
  <p><a href="/new">Make your own GiftLink</a> <a href="/">GiftLink home</a></p>
</main>`
}

function replaceTag(html, pattern, next, label) {
  const fresh = new RegExp(pattern.source, pattern.flags)
  if (!fresh.test(html)) throw new Error(`Built HTML is missing ${label}`)
  return html.replace(pattern, next)
}

function page(source, spec) {
  const url = `${origin}${spec.path === '/' ? '/' : spec.path}`
  let html = source.replaceAll('https://wiishlist.netlify.app', origin)
  html = replaceTag(html, /<title>[\s\S]*?<\/title>/, `<title>${spec.title}</title>`, 'title')
  html = replaceTag(
    html,
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${spec.description}" />`,
    'description',
  )
  html = replaceTag(
    html,
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${url}" />`,
    'canonical',
  )
  html = replaceTag(
    html,
    /<meta\s+property="og:url"[\s\S]*?\/>/,
    `<meta property="og:url" content="${url}" />`,
    'og:url',
  )
  html = replaceTag(
    html,
    /<meta\s+property="og:title"[\s\S]*?\/>/,
    `<meta property="og:title" content="${spec.title}" />`,
    'og:title',
  )
  html = replaceTag(
    html,
    /<meta\s+property="og:description"[\s\S]*?\/>/,
    `<meta property="og:description" content="${spec.description}" />`,
    'og:description',
  )
  html = replaceTag(
    html,
    /<meta\s+name="twitter:title"[\s\S]*?\/>/,
    `<meta name="twitter:title" content="${spec.title}" />`,
    'twitter:title',
  )
  if (!html.includes(`property="og:image" content="${origin}/og.jpg"`)) {
    throw new Error('Built HTML is missing an absolute og:image')
  }
  html = html.replace('<div id="root"></div>', `<div id="root">${spec.body}</div>`)
  if (!html.includes('<h1>')) throw new Error(`Prerender for ${spec.path} produced empty content`)
  return html
}

const homeHtml = page(template, home)
if (!homeHtml.includes('name="google-site-verification"')) {
  throw new Error('Prerendered home is missing the Google site verification tag')
}
if (!homeHtml.includes('G-EP4MKTGEZ4')) {
  throw new Error('Prerendered home is missing Google Analytics')
}
fs.writeFileSync(path.join(dist, 'index.html'), homeHtml)
fs.mkdirSync(path.join(dist, 'how-to'), { recursive: true })
fs.writeFileSync(path.join(dist, 'how-to', 'index.html'), page(template, howto))

for (const landing of landings) {
  const dir = path.join(dist, landing.path.replace(/^\//, ''))
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'index.html'),
    page(template, {
      path: landing.path,
      title: landing.title,
      description: landing.description,
      body: landingBody(landing),
    }),
  )
}

const sample = landings[0]
if (sample) {
  const sampleHtml = fs.readFileSync(
    path.join(dist, sample.path.replace(/^\//, ''), 'index.html'),
    'utf8',
  )
  if (!sampleHtml.includes('googletagmanager.com/gtag/js?id=G-EP4MKTGEZ4')) {
    throw new Error('Prerendered landing page is missing Google Analytics')
  }
}

const urls = ['/', '/how-to', ...landings.map((landing) => landing.path)]
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((loc) => `  <url><loc>${origin}${loc === '/' ? '/' : loc}</loc></url>`).join('\n')}
</urlset>
`
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap)
const robots = `User-agent: *
Allow: /api/og/
Disallow: /api/
Disallow: /me/

Sitemap: ${origin}/sitemap.xml
`
fs.writeFileSync(path.join(dist, 'robots.txt'), robots)
