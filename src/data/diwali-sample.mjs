import { DEFAULT_AMAZON_ASSOCIATE_TAG, amazonAffiliateUrl } from '../../netlify/lib/affiliate.mjs'

const GIFTS = [
  {
    title: 'Happilo Tyohar Diwali gift box',
    asin: 'B0FK2L2WSQ',
    price: 529,
    notes: 'Dry fruits, a terracotta diya, and a toran in one box.',
    priority: 'love',
  },
  {
    title: 'Golden lotus LED diyas, set of 2',
    asin: 'B0HH4Q82PR',
    price: 515,
    notes: 'Flameless, so they can sit on the rangoli.',
    priority: 'want',
  },
  {
    title: 'Desidiya diya curtain lights',
    asin: 'B0DFY3WNZT',
    price: 519,
    notes: 'Warm white, for the window or the balcony.',
    priority: 'want',
  },
  {
    title: "Haldiram's soan papdi, 200g",
    asin: 'B015INUNE6',
    price: 75,
    notes: 'The box people actually finish.',
    priority: 'want',
  },
  {
    title: 'Brass camphor diya',
    asin: 'B0FF9XSMWB',
    price: 541,
    notes: 'For the puja thali. One wick is enough.',
    priority: 'nice',
  },
]

function toItem(gift, id) {
  return {
    id,
    title: gift.title,
    url: amazonAffiliateUrl(`https://www.amazon.in/dp/${gift.asin}`, DEFAULT_AMAZON_ASSOCIATE_TAG),
    image: '',
    price: gift.price,
    currency: 'INR',
    store: 'amazon',
    notes: gift.notes,
    priority: gift.priority,
    reservedBy: null,
  }
}

export function diwaliSampleItems(makeId = (index) => `diwali-sample-${index + 1}`) {
  return GIFTS.map((gift, index) => toItem(gift, makeId(index)))
}

const QUICK_INDEXES = [0, 3, 1]

export function diwaliQuickAdds(makeId = (index) => `diwali-quick-${index + 1}`) {
  return QUICK_INDEXES.map((giftIndex, index) => toItem(GIFTS[giftIndex], makeId(index)))
}
