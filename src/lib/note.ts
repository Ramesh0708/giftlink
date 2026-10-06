const STOCK_ME =
  'If you were going to get me something this festive season, I’d love one of these — buy it in the Amazon/Flipkart sale if you can.'

export function defaultNote(name: string) {
  const who = name.trim()
  if (!who) return STOCK_ME
  const apostrophe = STOCK_ME.match(/I(.)d love/)?.[1] || "'"
  return `If you were going to get ${who} something this festive season, they${apostrophe}d love one of these — buy it in the Amazon/Flipkart sale if you can.`
}

export function isStockNote(message: string) {
  const text = message.trim()
  if (!text || text === STOCK_ME) return true
  return /^If you were going to get .+ something this festive season, they.d love one of these — buy it in the Amazon\/Flipkart sale if you can\.$/.test(
    text,
  )
}

export function displayNote(message: string, name: string) {
  if (isStockNote(message)) return defaultNote(name)
  return message
}
