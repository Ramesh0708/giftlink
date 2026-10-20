import fs from 'node:fs'
import path from 'node:path'

const origin = (process.env.URL || 'https://wiishlist.netlify.app').replace(/\/$/, '')
const dist = path.resolve('dist')
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')

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

fs.writeFileSync(path.join(dist, 'index.html'), page(template, home))
fs.mkdirSync(path.join(dist, 'how-to'), { recursive: true })
fs.writeFileSync(path.join(dist, 'how-to', 'index.html'), page(template, howto))

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${origin}/</loc></url>
  <url><loc>${origin}/how-to</loc></url>
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
