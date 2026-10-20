import type { Currency, StoreId } from '../types'

export type RegionId = 'india' | 'americas' | 'emea' | 'apac'

export type Experience = {
  id: RegionId
  name: string
  places: string
  summary: string
  currency: Currency
  occasion: string
  occasionHint: string
  lede: string
  steps: { title: string; body: string }[]
  heroGifts: { title: string; store: string; photo: string; pill: string; taken?: boolean }[]
  storeIds: StoreId[]
  shopNote: string
  footer: string
  linkPlaceholder: string
  addGiftHint: string
  gifterHint: string
  nameExample: string
  preferWhatsApp: boolean
  showFlipkart: boolean
  amazonListPlaceholder: string
  publishFlash: string
  copiedFlash: string
  liveHint: string
  editorAdd: string
  editorShare: string
  emptyBody: string
  howtoLede: string
  howtoOccasion: string
  howtoShops: string
  howtoSend: string
  howtoBuy: string
}

export const REGIONS: Experience[] = [
  {
    id: 'india',
    name: 'India',
    places: 'India',
    summary: 'Amazon, Flipkart, and Myntra · rupees · Diwali',
    currency: 'INR',
    occasion: 'Diwali 2026',
    occasionHint: 'Diwali 2026, birthday…',
    lede: 'Build a wishlist from Amazon, Flipkart, Myntra, and anywhere you shop. Connect a shared store list, send one WhatsApp link, and friends can reserve a gift so nobody doubles up.',
    steps: [
      {
        title: 'Connect Amazon or Flipkart',
        body: 'Link a shared wishlist from Amazon or Flipkart, pick the gifts you want, then add them here. Or paste a single product link.',
      },
      {
        title: 'Share one link',
        body: 'Send it on WhatsApp to family or the group chat. They see the list without needing an account.',
      },
      {
        title: 'They claim a gift',
        body: 'A friend taps “I’ll get this” so two people don’t buy the same thing. You won’t see who claimed it.',
      },
    ],
    heroGifts: [
      { title: 'Noise-cancelling headphones', store: 'Amazon', photo: '/photos/headphones.jpg', pill: '₹7,999' },
      { title: 'Forest green hoodie', store: 'Myntra', photo: '/photos/hoodie.jpg', pill: 'Riya’s getting this', taken: true },
      { title: 'Cast iron dosa tawa', store: 'Flipkart', photo: '/photos/tawa.jpg', pill: '₹1,249' },
    ],
    storeIds: ['amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'meesho', 'croma'],
    shopNote:
      'Amazon and Flipkart don’t allow apps to sign into your shopping account. Connect them with a shared wishlist link, or paste product URLs. GiftLink never asks for those passwords.',
    footer: 'Stuck? Read How to use GiftLink — three minutes, then send one WhatsApp message.',
    linkPlaceholder: 'https://www.amazon.in/… or Flipkart, Myntra…',
    addGiftHint: 'Copy the product link from your browser address bar on Amazon, Flipkart, or any shop, then paste it here.',
    gifterHint: 'Type your name, tap I’ll get this, then buy it on Amazon or Flipkart. They won’t see who claimed which gift.',
    nameExample: 'e.g. Arjun',
    preferWhatsApp: true,
    showFlipkart: true,
    amazonListPlaceholder: 'https://www.amazon.in/hz/wishlist/ls/…',
    publishFlash: 'Your list is live. Share it on WhatsApp.',
    copiedFlash: 'WhatsApp-ready message copied.',
    liveHint: 'Adding a gift publishes the list. Share on WhatsApp — friends open that link, not this editor.',
    editorAdd: 'Tap Add gift and paste a product link from Amazon or Flipkart — or connect a whole shared wishlist below.',
    editorShare: 'Tap Share on WhatsApp. The list is already live. Friends must open the link in the message, not this editor page.',
    emptyBody: 'Connect Amazon or Flipkart, or add a gift by name.',
    howtoLede:
      'You make a list of gifts you want. Friends open one link, pick something, and buy it on Amazon or Flipkart. Nobody has to guess — and two people won’t buy the same thing.',
    howtoOccasion: 'birthday, Diwali, housewarming',
    howtoShops: 'Amazon, Flipkart, or any shop',
    howtoSend:
      'Tap Share on WhatsApp. The list goes live when you add a gift — there is no separate publish step. The chat gets a picture card. Save your private edit link, and don’t send that one.',
    howtoBuy: 'Buy on Amazon / Flipkart',
  },
  {
    id: 'americas',
    name: 'Americas',
    places: 'United States, Canada, and the rest of the Americas',
    summary: 'Amazon, Target, and Walmart · dollars · holidays',
    currency: 'USD',
    occasion: 'Holiday 2026',
    occasionHint: 'Holiday 2026, Secret Santa, birthday…',
    lede: 'Build a wishlist from Amazon, Target, Walmart, and anywhere you shop. Send one link in Teams, Slack, or email, and colleagues can reserve a gift so nobody doubles up.',
    steps: [
      {
        title: 'Paste a product link',
        body: 'Copy a link from Amazon, Target, Walmart, or any shop. Or connect a shared Amazon wishlist and pick the gifts you want.',
      },
      {
        title: 'Share one link',
        body: 'Paste it into the office chat. They see the list without needing an account.',
      },
      {
        title: 'They claim a gift',
        body: 'A colleague taps “I’ll get this” so two people don’t buy the same thing. You won’t see who claimed it.',
      },
    ],
    heroGifts: [
      { title: 'Noise-cancelling headphones', store: 'Amazon', photo: '/photos/headphones.jpg', pill: '$149' },
      { title: 'Forest green hoodie', store: 'Target', photo: '/photos/hoodie.jpg', pill: 'Jordan’s getting this', taken: true },
      { title: 'Cast iron pan', store: 'Walmart', photo: '/photos/tawa.jpg', pill: '$32' },
    ],
    storeIds: ['amazon', 'target', 'walmart', 'bestbuy', 'etsy', 'ebay'],
    shopNote:
      'Amazon doesn’t let apps sign into your shopping account. Connect a shared wishlist link, or paste product URLs from any shop. GiftLink never asks for those passwords.',
    footer: 'Stuck? Read How to use GiftLink — then paste one message into Teams, Slack, or email.',
    linkPlaceholder: 'https://www.amazon.com/… or Target, Walmart…',
    addGiftHint: 'Copy the product link from Amazon, Target, Walmart, or any shop, then paste it here.',
    gifterHint: 'Type your name, tap I’ll get this, then buy it from the product link. They won’t see who claimed which gift.',
    nameExample: 'e.g. Jordan',
    preferWhatsApp: false,
    showFlipkart: false,
    amazonListPlaceholder: 'https://www.amazon.com/hz/wishlist/ls/…',
    publishFlash: 'Your list is live. Share it on WhatsApp.',
    copiedFlash: 'Message copied. Paste it into Teams, Slack, or email.',
    liveHint: 'Adding a gift publishes the list. Share on WhatsApp, or copy the message. Friends open that link, not this editor.',
    editorAdd: 'Tap Add gift and paste a product link from Amazon, Target, Walmart, or any shop.',
    editorShare: 'Tap Share on WhatsApp (or copy the message). The list is already live. Friends must open that link, not this editor page.',
    emptyBody: 'Connect Amazon, or add a gift from any shop.',
    howtoLede:
      'You make a list of gifts you want. Colleagues open one link, pick something, and buy it from the store on that gift. Nobody has to guess — and two people won’t buy the same thing.',
    howtoOccasion: 'a birthday, Secret Santa, or the holidays',
    howtoShops: 'Amazon, Target, Walmart, or any shop',
    howtoSend:
      'Tap Share on WhatsApp, or copy the message into Teams, Slack, or email. The list goes live when you add a gift. Save your private edit link, and don’t send that one.',
    howtoBuy: 'Buy on the store named on the gift',
  },
  {
    id: 'emea',
    name: 'EMEA',
    places: 'Europe, the Middle East, and Africa',
    summary: 'Amazon, John Lewis, and Zalando · euro or pound · Christmas',
    currency: 'EUR',
    occasion: 'Christmas 2026',
    occasionHint: 'Christmas 2026, Secret Santa, birthday…',
    lede: 'Build a wishlist from Amazon, John Lewis, Zalando, and anywhere you shop. Send one link in Teams, Slack, or email, and colleagues can reserve a gift so nobody doubles up.',
    steps: [
      {
        title: 'Paste a product link',
        body: 'Copy a link from your local Amazon, John Lewis, Zalando, or any shop. Prices can be in euros, pounds, or dirhams.',
      },
      {
        title: 'Share one link',
        body: 'Paste it into the office chat. They see the list without needing an account.',
      },
      {
        title: 'They claim a gift',
        body: 'A colleague taps “I’ll get this” so two people don’t buy the same thing. You won’t see who claimed it.',
      },
    ],
    heroGifts: [
      { title: 'Noise-cancelling headphones', store: 'Amazon', photo: '/photos/headphones.jpg', pill: '€129' },
      { title: 'Forest green hoodie', store: 'Zalando', photo: '/photos/hoodie.jpg', pill: 'Alex’s getting this', taken: true },
      { title: 'Cast iron pan', store: 'John Lewis', photo: '/photos/tawa.jpg', pill: '£28' },
    ],
    storeIds: ['amazon', 'johnlewis', 'argos', 'zalando', 'etsy', 'ebay'],
    shopNote:
      'Amazon doesn’t let apps sign into your shopping account. Connect a shared wishlist link, or paste product URLs from any shop. GiftLink never asks for those passwords.',
    footer: 'Stuck? Read How to use GiftLink — then paste one message into Teams, Slack, or email.',
    linkPlaceholder: 'https://www.amazon.co.uk/… or amazon.de, Zalando…',
    addGiftHint: 'Copy the product link from Amazon, John Lewis, Zalando, or any shop, then paste it here. Set the currency to EUR, GBP, or AED if the guess is wrong.',
    gifterHint: 'Type your name, tap I’ll get this, then buy it from the product link. They won’t see who claimed which gift.',
    nameExample: 'e.g. Alex',
    preferWhatsApp: false,
    showFlipkart: false,
    amazonListPlaceholder: 'https://www.amazon.co.uk/hz/wishlist/ls/…',
    publishFlash: 'Your list is live. Share it on WhatsApp.',
    copiedFlash: 'Message copied. Paste it into Teams, Slack, or email.',
    liveHint: 'Adding a gift publishes the list. Share on WhatsApp, or copy the message. Friends open that link, not this editor.',
    editorAdd: 'Tap Add gift and paste a product link from Amazon, John Lewis, Zalando, or any shop.',
    editorShare: 'Tap Share on WhatsApp (or copy the message). The list is already live. Friends must open that link, not this editor page.',
    emptyBody: 'Connect Amazon, or add a gift from any shop.',
    howtoLede:
      'You make a list of gifts you want. Colleagues open one link, pick something, and buy it from the store on that gift. Nobody has to guess — and two people won’t buy the same thing.',
    howtoOccasion: 'Christmas, Secret Santa, or a birthday',
    howtoShops: 'Amazon, John Lewis, Zalando, or any shop',
    howtoSend:
      'Tap Share on WhatsApp, or copy the message into Teams, Slack, or email. The list goes live when you add a gift. Save your private edit link, and don’t send that one.',
    howtoBuy: 'Buy on the store named on the gift',
  },
  {
    id: 'apac',
    name: 'APAC',
    places: 'Asia-Pacific, outside India',
    summary: 'Shopee, Lazada, and Amazon · 11.11 and year-end',
    currency: 'SGD',
    occasion: 'Year-end 2026',
    occasionHint: 'Year-end 2026, 11.11, birthday…',
    lede: 'Build a wishlist from Shopee, Lazada, Amazon, and anywhere you shop. Send one link in Teams, Slack, or email, and colleagues can reserve a gift so nobody doubles up.',
    steps: [
      {
        title: 'Paste a product link',
        body: 'Copy a link from Shopee, Lazada, Amazon, or any shop that delivers to the buyer. Set the currency on that gift.',
      },
      {
        title: 'Share one link',
        body: 'Paste it into the office chat. They see the list without needing an account.',
      },
      {
        title: 'They claim a gift',
        body: 'A colleague taps “I’ll get this” so two people don’t buy the same thing. You won’t see who claimed it.',
      },
    ],
    heroGifts: [
      { title: 'Noise-cancelling headphones', store: 'Amazon', photo: '/photos/headphones.jpg', pill: 'S$189' },
      { title: 'Forest green hoodie', store: 'Shopee', photo: '/photos/hoodie.jpg', pill: 'Mei’s getting this', taken: true },
      { title: 'Cast iron pan', store: 'Lazada', photo: '/photos/tawa.jpg', pill: 'S$42' },
    ],
    storeIds: ['amazon', 'shopee', 'lazada', 'rakuten', 'etsy', 'ebay'],
    shopNote:
      'Amazon doesn’t let apps sign into your shopping account. Connect a shared wishlist link, or paste product URLs from Shopee, Lazada, or any shop. GiftLink never asks for those passwords.',
    footer: 'Stuck? Read How to use GiftLink — then paste one message into Teams, Slack, or email.',
    linkPlaceholder: 'https://shopee.sg/… or Lazada, Amazon…',
    addGiftHint: 'Copy the product link from Shopee, Lazada, Amazon, or any shop, then paste it here. Set SGD, AUD, JPY, or the currency that shop uses.',
    gifterHint: 'Type your name, tap I’ll get this, then buy it from the product link. They won’t see who claimed which gift.',
    nameExample: 'e.g. Mei',
    preferWhatsApp: false,
    showFlipkart: false,
    amazonListPlaceholder: 'https://www.amazon.sg/hz/wishlist/ls/…',
    publishFlash: 'Your list is live. Share it on WhatsApp.',
    copiedFlash: 'Message copied. Paste it into Teams, Slack, or email.',
    liveHint: 'Adding a gift publishes the list. Share on WhatsApp, or copy the message. Friends open that link, not this editor.',
    editorAdd: 'Tap Add gift and paste a product link from Shopee, Lazada, Amazon, or any shop.',
    editorShare: 'Tap Share on WhatsApp (or copy the message). The list is already live. Friends must open that link, not this editor page.',
    emptyBody: 'Connect Amazon, or add a gift from any shop.',
    howtoLede:
      'You make a list of gifts you want. Colleagues open one link, pick something, and buy it from the store on that gift. Nobody has to guess — and two people won’t buy the same thing.',
    howtoOccasion: 'year-end, 11.11, or a birthday',
    howtoShops: 'Shopee, Lazada, Amazon, or any shop',
    howtoSend:
      'Tap Share on WhatsApp, or copy the message into Teams, Slack, or email. The list goes live when you add a gift. Save your private edit link, and don’t send that one.',
    howtoBuy: 'Buy on the store named on the gift',
  },
]

const KNOWN = new Set(REGIONS.map((region) => region.occasion))

export function isDefaultOccasion(occasion: string) {
  return KNOWN.has(occasion)
}

export function regionById(id: RegionId) {
  return REGIONS.find((region) => region.id === id) ?? REGIONS[0]
}

const STORAGE_KEY = 'giftlink:region'

export function loadRegion(): RegionId | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'india' || value === 'americas' || value === 'emea' || value === 'apac') return value
  } catch {
    return null
  }
  return null
}

export function inferRegion(): RegionId {
  const saved = loadRegion()
  if (saved) return saved
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    const lang = (navigator.language || '').toLowerCase()
    if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta' || lang.endsWith('-in')) return 'india'
    if (/^(America|US|Canada|Brazil)\//.test(tz) || lang.endsWith('-us') || lang.endsWith('-ca') || lang.endsWith('-br')) {
      return 'americas'
    }
    if (/^(Europe|Africa|Atlantic)\//.test(tz)) return 'emea'
    if (/^(Australia|Pacific)\//.test(tz) || tz.startsWith('Asia/')) return 'apac'
  } catch {
    /* fall through to the default */
  }
  return 'india'
}

export function saveRegion(id: RegionId) {
  localStorage.setItem(STORAGE_KEY, id)
}
