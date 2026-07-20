import Groq from 'groq-sdk'
import { searchAmazonProducts } from './amazonClient.js'

const SYSTEM_PROMPT = `You are ShopGPT, a shopping assistant that searches Amazon from natural language.

Reply with ONLY valid JSON (no markdown) using this shape:
{
  "message": "Short friendly reply about what you will search for / found",
  "searchQuery": "gaming monitor",
  "maxPrice": 800,
  "minPrice": null,
  "requiredTerms": ["monitor"],
  "optionalTerms": ["gaming"],
  "clearFilters": false
}

Rules:
- searchQuery: concise Amazon search keywords (no price words). Example: "black running shoes", "wireless headphones".
- maxPrice / minPrice: numbers or null. "under $800" / "below 800" / "less than 800" => maxPrice 800. "over $50" => minPrice 50. "between 20 and 100" => minPrice 20, maxPrice 100.
- requiredTerms: core product nouns only (e.g. "monitor", "pants"). Do NOT put modifiers like "gaming", colors, or brands here.
- optionalTerms: modifiers that boost ranking (e.g. "gaming", "black", "curved").
- If the user wants to reset / see everything, set clearFilters to true and searchQuery to "".
- Keep message concise (1-2 sentences). Prefer precision over recall.`

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function latestUserText(messages) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === 'user' && messages[i]?.content) {
      return String(messages[i].content)
    }
  }
  return ''
}

function parsePriceFromText(text) {
  const normalized = text.toLowerCase().replace(/,/g, '')
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

function termHits(product, terms) {
  if (!terms.length) return 0
  const blob = textBlob(product)
  return terms.reduce(
    (score, term) => score + (blob.includes(String(term).toLowerCase()) ? 1 : 0),
    0,
  )
}

function withinPrice(product, { minPrice, maxPrice, maxExclusive }) {
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

function refineProducts(products, parsed, userText) {
  const fromText = parsePriceFromText(userText)
  const minPrice = toNumberOrNull(parsed.minPrice) ?? fromText.minPrice
  const maxPrice = toNumberOrNull(parsed.maxPrice) ?? fromText.maxPrice
  const maxExclusive =
    fromText.maxPrice != null
      ? fromText.maxExclusive
      : /under|below|less than|cheaper than/i.test(userText)

  const requiredTerms = Array.isArray(parsed.requiredTerms)
    ? parsed.requiredTerms.map(String).filter(Boolean)
    : []
  const optionalTerms = Array.isArray(parsed.optionalTerms)
    ? parsed.optionalTerms.map(String).filter(Boolean)
    : []

  const priced = products.filter((product) =>
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

function createChatHandler({ groqApiKey, rapidApiKey }) {
  const groq = new Groq({ apiKey: groqApiKey })

  return async function chatHandler(req, res, next) {
    const url = req.url?.split('?')[0]
    if (url !== '/api/chat') {
      next()
      return
    }

    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.end()
      return
    }

    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' })
      return
    }

    if (!groqApiKey) {
      sendJson(res, 500, { error: 'GROQ_API_KEY is not configured' })
      return
    }

    try {
      const raw = await readBody(req)
      const body = JSON.parse(raw || '{}')
      const messages = Array.isArray(body.messages) ? body.messages : []

      if (messages.length === 0) {
        sendJson(res, 400, { error: 'messages are required' })
        return
      }

      const userText = latestUserText(messages)

      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Conversation:\n${JSON.stringify(messages)}`,
          },
        ],
      })

      const content = completion.choices?.[0]?.message?.content || '{}'
      let parsed
      try {
        parsed = JSON.parse(content)
      } catch {
        sendJson(res, 502, { error: 'Model returned invalid JSON', raw: content })
        return
      }

      const fromText = parsePriceFromText(userText)
      const minPrice = toNumberOrNull(parsed.minPrice) ?? fromText.minPrice
      const maxPrice = toNumberOrNull(parsed.maxPrice) ?? fromText.maxPrice
      const searchQuery =
        typeof parsed.searchQuery === 'string' && parsed.searchQuery.trim()
          ? parsed.searchQuery.trim()
          : userText.replace(
              /under\s*\$?\s*\d+|below\s*\$?\s*\d+|less than\s*\$?\s*\d+|between\s*\$?\s*\d+\s*(and|to)\s*\$?\s*\d+/gi,
              '',
            ).trim() || userText.trim() || 'products'

      if (parsed.clearFilters) {
        sendJson(res, 200, {
          message:
            typeof parsed.message === 'string' && parsed.message.trim()
              ? parsed.message.trim()
              : 'Okay — cleared the previous filter. Search again when you’re ready.',
          products: [],
          clearFilters: true,
          searchQuery: '',
        })
        return
      }

      const result = await searchAmazonProducts({
        apiKey: rapidApiKey,
        query: searchQuery,
        minPrice: minPrice ?? undefined,
        // Amazon max_price is "lower than" — pass through; we also refine client-side
        maxPrice: maxPrice ?? undefined,
      })

      const products = refineProducts(result.products, parsed, userText)

      let message =
        typeof parsed.message === 'string' && parsed.message.trim()
          ? parsed.message.trim()
          : ''

      if (!message) {
        message = products.length
          ? `I found ${products.length} Amazon result${products.length === 1 ? '' : 's'} for “${searchQuery}”.`
          : `I couldn’t find Amazon products for “${searchQuery}” with those constraints.`
      } else if (products.length === 0) {
        message = `I couldn’t find Amazon products that match those constraints. Try widening the price or keywords.`
      }

      sendJson(res, 200, {
        message,
        products,
        clearFilters: false,
        searchQuery,
      })
    } catch (error) {
      console.error('[api/chat]', error)
      sendJson(res, error.status || 500, {
        error: error?.message || 'Failed to search products',
        details: error.payload || undefined,
      })
    }
  }
}

export function groqChatPlugin({ groqApiKey, rapidApiKey }) {
  const handler = createChatHandler({ groqApiKey, rapidApiKey })

  return {
    name: 'groq-chat-api',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}
