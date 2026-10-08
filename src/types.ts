export type StoreId =
  | 'amazon'
  | 'flipkart'
  | 'myntra'
  | 'ajio'
  | 'nykaa'
  | 'meesho'
  | 'croma'
  | 'target'
  | 'walmart'
  | 'bestbuy'
  | 'etsy'
  | 'ebay'
  | 'johnlewis'
  | 'argos'
  | 'zalando'
  | 'shopee'
  | 'lazada'
  | 'rakuten'
  | 'other'

export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD' | 'SGD' | 'AED' | 'JPY'

export type Priority = 'love' | 'want' | 'nice'

export type WishItem = {
  id: string
  title: string
  url: string
  image: string
  price: number | null
  currency: Currency
  store: StoreId
  notes: string
  priority: Priority
  reservedBy: string | null
}

export type Wishlist = {
  id: string
  recipient: string
  occasion: string
  message: string
  updatedAt: string
  items: WishItem[]
}

export type StoreLink = {
  store: 'amazon' | 'flipkart'
  url: string
  name: string
  linkedAt: string
}

export type StoredList = Wishlist & {
  ownerKey: string
  links?: StoreLink[]
  published?: boolean
}
