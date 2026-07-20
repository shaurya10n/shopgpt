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

/** True when the message is mostly a filter/refine, not a new product search. */
export function isRefinementMessage(text) {
  const raw = String(text || '').trim()
  if (!raw) return false

  const withoutPrice = raw
    .toLowerCase()
    .replace(/,/g, '')
    .replace(
      /(?:under|below|less than|cheaper than|upto|up to|at most|no more than|max(?:imum)?(?:\s+of)?|over|above|more than|at least|minimum|between)\s*\$?\s*\d+(?:\.\d+)?(?:\s*(?:and|to|-)\s*\$?\s*\d+(?:\.\d+)?)?/gi,
      ' ',
    )
    .replace(/\$\s*\d+(?:\.\d+)?/g, ' ')
    .replace(
      /\b(show|me|the|results?|items?|products?|ones?|only|please|filter|refine|with|for|that|are|is|of|a|an|my|find|get|list|display)\b/gi,
      ' ',
    )
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!withoutPrice) return true
  if (withoutPrice.split(' ').filter(Boolean).length <= 1 && withoutPrice.length <= 12) {
    return true
  }
  return false
}

export function looksLikeJunkQuery(query) {
  const q = String(query || '')
    .toLowerCase()
    .trim()
  if (!q) return true
  if (
    /^(show|results?|items?|products?|filter|refine|search|stuff|things|ones?)$/i.test(
      q,
    )
  ) {
    return true
  }
  return false
}

export function resolveSearchQuery({ parsedQuery, userText, currentSearchQuery }) {
  const fromModel =
    typeof parsedQuery === 'string' && parsedQuery.trim() ? parsedQuery.trim() : ''
  const strippedUser = String(userText || '')
    .replace(
      /under\s*\$?\s*\d+|below\s*\$?\s*\d+|less than\s*\$?\s*\d+|between\s*\$?\s*\d+\s*(and|to)\s*\$?\s*\d+/gi,
      '',
    )
    .replace(
      /\b(show|me|the|results?|items?|products?|only|please|filter|refine)\b/gi,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim()

  const current = (currentSearchQuery || '').trim()

  if (current) {
    if (isRefinementMessage(userText) || looksLikeJunkQuery(fromModel) || !fromModel) {
      return current
    }
    const currentTokens = current
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2)
    const modelLower = fromModel.toLowerCase()
    const keepsIntent =
      currentTokens.length === 0 ||
      currentTokens.some((token) => modelLower.includes(token))
    if (!keepsIntent) return current
    return fromModel
  }

  if (fromModel && !looksLikeJunkQuery(fromModel)) return fromModel
  if (strippedUser && !looksLikeJunkQuery(strippedUser)) return strippedUser
  return String(userText || '').trim() || 'products'
}
