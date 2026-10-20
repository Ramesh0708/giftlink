import assert from 'node:assert/strict'
import test from 'node:test'
import { displayPhoto } from './photos.mjs'

test('local product photos use the smaller webp variant', () => {
  assert.equal(displayPhoto('/photos/headphones.jpg', 'card'), '/photos/headphones-800.webp')
  assert.equal(displayPhoto('/photos/hoodie.jpg', 'thumb'), '/photos/hoodie-160.webp')
  assert.equal(displayPhoto('/photos/tawa.jpeg', 'card'), '/photos/tawa-800.webp')
})

test('remote product photos stay on their own URL', () => {
  const remote = 'https://m.media-amazon.com/images/I/example.jpg'
  assert.equal(displayPhoto(remote, 'card'), remote)
  assert.equal(displayPhoto('', 'thumb'), '')
})
