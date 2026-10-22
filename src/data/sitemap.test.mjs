import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { sitemapXml, staticSitemapPaths } from './sitemap.mjs'

test('sitemap lists the home page, Diwali, and every static page with lastmod', () => {
  const xml = sitemapXml()
  const paths = staticSitemapPaths()
  assert.ok(paths.includes('/'))
  assert.ok(paths.includes('/diwali-gift-list/'))
  assert.ok(paths.includes('/how-to/'))
  assert.ok(paths.includes('/wedding-registry-india/'))
  assert.ok(paths.includes('/birthday-wishlist/'))
  assert.ok(paths.includes('/baby-shower-registry/'))
  assert.ok(paths.includes('/housewarming-gift-list/'))
  assert.ok(paths.includes('/secret-santa-india/'))
  assert.ok(paths.includes('/share-amazon-wishlist/'))
  assert.equal(paths.length, 9)
  for (const path of paths) {
    const loc = `https://wiishlist.netlify.app${path === '/' ? '/' : path}`
    assert.match(xml, new RegExp(`<loc>${loc}</loc>\\s*<lastmod>2026-10-22</lastmod>`))
  }
  assert.equal(fs.readFileSync(new URL('../../public/sitemap.xml', import.meta.url), 'utf8'), xml)
})
