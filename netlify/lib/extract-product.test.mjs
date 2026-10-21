import assert from 'node:assert/strict'
import test from 'node:test'
import {
  extractProduct,
  flipkartCardForUrl,
  flipkartCardsFromHtml,
  flipkartTitleFromUrl,
  isJunkTitle,
  isUsableProduct,
  productFromRome,
} from './extract-product.mjs'

test('ignores the Amazon search shortcut and reads the product title and price', () => {
  const html = `<!doctype html><title>Amazon.in</title>
    <option>Under ₹500</option>
    <span id="productTitle">  Sony headphones  </span>
    <div id="corePrice_feature_div"><span class="a-price-whole">7,999</span></div>
    <img id="landingImage" src="https://m.media-amazon.com/images/I/71abc._SX342_.jpg" />`
  const data = extractProduct(html, 'https://www.amazon.in/dp/B0CHX1W1XY')
  assert.equal(data.title, 'Sony headphones')
  assert.equal(data.price, 7999)
  assert.match(data.image, /_SL500_\.jpg$/)
  assert.equal(isUsableProduct(data), true)
})

test('treats Amazon and Flipkart block pages as junk', () => {
  const amazon = extractProduct(
    '<title>Amazon.in</title><meta property="og:image" content="https://images-eu.ssl-images-amazon.com/images/G/02/x-locale/common/orange-arrow.gif" />',
    'https://www.amazon.in/dp/B0CHX1W1XY',
  )
  assert.equal(isUsableProduct(amazon), false)
  assert.equal(amazon.image, '')
  assert.equal(amazon.price, null)

  const down = extractProduct('<title>503 - Service Unavailable Error</title>', 'https://www.amazon.in/dp/B0CHX1W1XY')
  assert.equal(isJunkTitle(down.title), true)

  const forYou = extractProduct(
    '<title>For You</title><meta property="og:image" content="https://rukminim2.flixcart.com/fk-p-flap/52/44/image/banner.png" />',
    'https://www.flipkart.com/',
  )
  assert.equal(isUsableProduct(forYou), false)
  assert.equal(forYou.image, '')

  const flipkart = extractProduct(
    '<title>Online Shopping India | Buy Mobiles, Electronics, Appliances, Clothing and More Online at Flipkart.com</title><meta property="og:image" content="https://rukminim1.flixcart.com/www/800/800/promos/banner.png" />',
    'https://www.flipkart.com/boat/p/itm123',
  )
  assert.equal(isUsableProduct(flipkart), false)
  assert.equal(flipkart.image, '')
  assert.equal(flipkart.price, null)
})

test('reads the mobile buy-box price when the desktop price widget is missing', () => {
  const html = `<title>Apple iPhone 15 (128 GB) - Black</title>
    <span class="a-offscreen">₹76,999.00</span>
    <span class="a-offscreen">M.R.P: ₹79,900</span>`
  const data = extractProduct(html, 'https://www.amazon.in/gp/aw/d/B0CHX1W1XY')
  assert.equal(data.price, 76999)
  assert.equal(isUsableProduct(data), true)
})

test('ignores return-policy thresholds that are not the product price', () => {
  const html = `<span id="productTitle">Apple iPhone 15</span>
    <p>For products worth more than INR 25000, we only offer Self-Return.</p>`
  const data = extractProduct(html, 'https://www.amazon.in/dp/B0CHX1W1XY')
  assert.equal(data.title, 'Apple iPhone 15')
  assert.equal(data.price, null)

  const priced = extractProduct(
    `${html}<div id="corePrice_feature_div"><span class="a-price-whole">76,999</span></div>`,
    'https://www.amazon.in/dp/B0CHX1W1XY',
  )
  assert.equal(priced.price, 76999)
})

test('builds a Flipkart title from the slug and pid when the shop blocks the page', () => {
  const title = flipkartTitleFromUrl(
    'https://www.flipkart.com/boat-airdopes-219-40h-battery-free-music/p/itm9514600334640?pid=ACCHCJW3HZ2GVH29',
  )
  assert.match(title, /Boat Airdopes 219 40H Battery/)
  assert.match(title, /ACCHCJW3HZ2GVH29/)
  assert.equal(isJunkTitle(title), false)
  assert.equal(flipkartTitleFromUrl('https://www.flipkart.com/'), '')
})

test('reads a Flipkart search card and matches item id, pid, or the product slug', () => {
  const html = `
    <a href="/noise-earbuds/p/itm00000000000001?pid=ACCJUNK000000001">
      <img alt="Online Shopping India" src="https://rukminim2.flixcart.com/www/800/800/promos/banner.png" />
      ₹197
    </a>
    <div>Under ₹10,000</div>
    <a href="/apple-iphone-15-black-128-gb/p/itm3234701b0863a?pid=MOBHQV9YR4CBTD9D&amp;lid=LST1">
      <img alt="Apple iPhone 15 (Black, 128 GB)" src="https://rukminim2.flixcart.com/image/312/312/xif0q/mobile/s/p/z/-original-imahqvadjn9nthhu.jpeg?q=70" />
      ₹67,999
      <div>₹79,900</div>
    </a>`
  const cards = flipkartCardsFromHtml(html)
  assert.equal(cards.length, 1)
  assert.equal(cards[0].title, 'Apple iPhone 15 (Black, 128 GB)')
  assert.equal(cards[0].price, 67999)
  assert.match(cards[0].image, /\/image\/800\/800\//)

  const exact = flipkartCardForUrl(
    html,
    'https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm3234701b0863a?pid=MOBHQV9YR4CBTD9D',
  )
  assert.equal(exact.itm, 'itm3234701b0863a')

  const byPid = flipkartCardForUrl(
    html,
    'https://www.flipkart.com/something-else/p/itm999?pid=MOBHQV9YR4CBTD9D',
  )
  assert.equal(byPid.title, 'Apple iPhone 15 (Black, 128 GB)')

  const held = flipkartCardForUrl(
    html,
    'https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac6485515ae4',
  )
  assert.equal(held.pid, 'MOBHQV9YR4CBTD9D')
  assert.equal(held.price, 67999)
})

test('reads Flipkart Rome schema and falls back to finalPrice', () => {
  const data = productFromRome(
    {
      RESPONSE: {
        pageData: {
          seoData: {
            schema: [
              {
                '@type': 'Product',
                name: 'Apple iPhone 15 (Black, 128 GB)',
                image: [
                  'https://rukminim2.flixcart.com/image/312/312/xif0q/mobile/s/p/z/-original-imahqvadjn9nthhu.jpeg',
                ],
              },
            ],
          },
        },
      },
      finalPrice: 74900,
    },
    'https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm3234701b0863a',
  )
  assert.equal(data.title, 'Apple iPhone 15 (Black, 128 GB)')
  assert.equal(data.price, 74900)
  assert.match(data.image, /\/image\/800\/800\//)
  assert.equal(
    productFromRome({ ERROR_MESSAGE: 'Product is ON_HOLD, cannot be processed' }, 'https://www.flipkart.com/x/p/itm1'),
    null,
  )
})

test('reads JSON-LD product name, offer price, and image', () => {
  const html = `<script type="application/ld+json">{"@type":"Product","name":"boAt Airdopes 219","image":["https://rukmini1.flixcart.com/image/1500/1500/xif0q/headphone/a.jpg"],"offers":{"price":865,"priceCurrency":"INR"}}</script>`
  const data = extractProduct(html, 'https://www.flipkart.com/boat/p/itm9514600334640')
  assert.equal(data.title, 'boAt Airdopes 219')
  assert.equal(data.price, 865)
  assert.match(data.image, /headphone\/a\.jpg/)
})
