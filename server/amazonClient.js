const AMAZON_HOST = 'real-time-amazon-data.p.rapidapi.com'
const AMAZON_SEARCH_URL = `https://${AMAZON_HOST}/search`

export function parseAmazonPrice(value) {
  if (value == null) return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const cleaned = String(value).replace(/[^0-9.]/g, '')
  if (!cleaned) return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

export function normalizeAmazonProduct(raw) {
  const price =
    parseAmazonPrice(raw.product_price) ??
    parseAmazonPrice(raw.product_minimum_offer_price) ??
    0

  const rating = raw.product_star_rating
    ? `${raw.product_star_rating}★`
    : null
  const ratingsCount = raw.product_num_ratings
    ? `${raw.product_num_ratings} ratings`
    : null
  const bits = [rating, ratingsCount, raw.delivery, raw.sales_volume].filter(
    Boolean,
  )

  return {
    id: raw.asin || raw.product_id || `amazon-${Math.random().toString(36).slice(2)}`,
    title: raw.product_title || 'Amazon product',
    price,
    image: raw.product_photo || '',
    category: raw.product_byline || 'Amazon',
    description: bits.length ? bits.join(' · ') : raw.product_title || '',
    productUrl: raw.product_url || null,
    source: 'Amazon',
    rating: raw.product_star_rating != null ? Number(raw.product_star_rating) : null,
  }
}

export async function searchAmazonProducts({
  apiKey,
  query,
  page = 1,
  country = 'US',
  minPrice,
  maxPrice,
}) {
  if (!apiKey) {
    const error = new Error('RAPIDAPI_KEY is not configured')
    error.status = 500
    throw error
  }

  const params = new URLSearchParams({
    query: query || 'electronics',
    page: String(page),
    country,
    sort_by: 'RELEVANCE',
    product_condition: 'ALL',
  })

  if (minPrice != null && Number.isFinite(Number(minPrice))) {
    params.set('min_price', String(minPrice))
  }
  if (maxPrice != null && Number.isFinite(Number(maxPrice))) {
    params.set('max_price', String(maxPrice))
  }

  const response = await fetch(`${AMAZON_SEARCH_URL}?${params}`, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': AMAZON_HOST,
    },
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(
      payload.message ||
        payload.error ||
        `Amazon API request failed (${response.status})`,
    )
    error.status = response.status
    error.payload = payload
    throw error
  }

  if (payload.message && !payload.data) {
    const error = new Error(payload.message)
    error.status = 402
    error.payload = payload
    throw error
  }

  const rawProducts = payload?.data?.products || payload?.products || []
  const products = rawProducts.map(normalizeAmazonProduct).filter((p) => p.id)

  return {
    products,
    total: payload?.data?.total_products ?? products.length,
    query: query || 'electronics',
  }
}
