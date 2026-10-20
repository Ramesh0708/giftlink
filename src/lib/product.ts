export const MANUAL_FILL = "Couldn't fetch this product. Fill it in manually."

export function isJunkProductTitle(title: string) {
  const value = title.replace(/\s+/g, ' ').trim()
  if (value.length < 3) return true
  return (
    /^(?:www\.)?(?:amazon|flipkart)(?:\.[a-z]{2,3})?(?:\.[a-z]{2})?$/i.test(value) ||
    /online shopping india/i.test(value) ||
    /buy mobiles, electronics/i.test(value) ||
    /service unavailable/i.test(value) ||
    /page not found/i.test(value) ||
    /robot check/i.test(value) ||
    /something went wrong/i.test(value) ||
    /^50[23]\b/.test(value) ||
    /^404\b/.test(value) ||
    /^for you$/i.test(value) ||
    /^home$/i.test(value)
  )
}
