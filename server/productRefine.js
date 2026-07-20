export function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function latestUserText(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === 'user' && messages[i]?.content) {
      return String(messages[i].content)
    }
  }
  return ''
}

/** Parse hard price bounds from the user message as a safety net. */
export function parsePriceFromText(text) {
  const normalized = String(text || '')
    .toLowerCase()
    .replace(/,/g, '')
  let maxPrice = null
  let minPrice = null

  const between = normalized.match(
    /between\s*\$?\s*(\d+(?:\.\d+)?)\s*(?:and|to|-)\s*\$?\s*(\d+(?:\.\d+)?)/,
  )
  if (between) {
    minPrice = Number(between[1])
    maxPrice = Number(between[2])
    if (minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice]
    return { minPrice, maxPrice, maxExclusive: false }
  }

  const under = normalized.match(
    /(?:under|below|less than|cheaper than|upto|up to)\s*\$?\s*(\d+(?:\.\d+)?)/,
  )
  if (under) {
    return { minPrice, maxPrice: Number(under[1]), maxExclusive: true }
  }

  const atMost = normalized.match(
    /(?:at most|no more than|max(?:imum)?(?:\s+of)?|<=|≤)\s*\$?\s*(\d+(?:\.\d+)?)/,
  )
  if (atMost) {
    return { minPrice, maxPrice: Number(atMost[1]), maxExclusive: false }
  }

  const over = normalized.match(
    /(?:over|above|more than|at least|minimum|>=|≥)\s*\$?\s*(\d+(?:\.\d+)?)/,
  )
  if (over) {
    minPrice = Number(over[1])
  }

  return { minPrice, maxPrice, maxExclusive: true }
}

function textBlob(product) {
  return `${product.title} ${product.category} ${product.description}`.toLowerCase()
}

export function termHits(product, terms) {
  if (!terms.length) return 0
  const blob = textBlob(product)
  return terms.reduce(
    (score, term) => score + (blob.includes(String(term).toLowerCase()) ? 1 : 0),
    0,
  )
}

export function withinPrice(product, { minPrice, maxPrice, maxExclusive }) {
  const price = Number(product.price)
  if (!Number.isFinite(price)) return false
  if (minPrice != null && price < minPrice) return false
  if (maxPrice != null) {
    if (maxExclusive ? price >= maxPrice : price > maxPrice) return false
  }
  return true
}

function narrowByTerms(priced, requiredTerms) {
  if (!requiredTerms.length) return priced

  const withAll = priced.filter(
    (product) => termHits(product, requiredTerms) === requiredTerms.length,
  )
  if (withAll.length) return withAll

  const withAny = priced.filter((product) => termHits(product, requiredTerms) > 0)
  return withAny.length ? withAny : priced
}

/**
 * Enforce price/term constraints on Amazon search results after the LLM responds.
 */
export function refineProducts(products, parsed, userText) {
  const fromText = parsePriceFromText(userText)
  const minPrice = toNumberOrNull(parsed?.minPrice) ?? fromText.minPrice
  const maxPrice = toNumberOrNull(parsed?.maxPrice) ?? fromText.maxPrice
  const maxExclusive =
    fromText.maxPrice != null
      ? fromText.maxExclusive
      : /under|below|less than|cheaper than/i.test(userText || '')

  const requiredTerms = Array.isArray(parsed?.requiredTerms)
    ? parsed.requiredTerms.map(String).filter(Boolean)
    : []
  const optionalTerms = Array.isArray(parsed?.optionalTerms)
    ? parsed.optionalTerms.map(String).filter(Boolean)
    : []

  const priced = (products || []).filter((product) =>
    withinPrice(product, { minPrice, maxPrice, maxExclusive }),
  )
  const eligible = narrowByTerms(priced, requiredTerms)

  return [...eligible].sort(
    (a, b) =>
      termHits(b, requiredTerms) * 3 +
        termHits(b, optionalTerms) * 2 -
        (termHits(a, requiredTerms) * 3 + termHits(a, optionalTerms) * 2) ||
      a.price - b.price,
  )
}
