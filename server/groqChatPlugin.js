import Groq from 'groq-sdk'
import { searchAmazonProducts } from './amazonClient.js'
import {
  latestUserText,
  parsePriceFromText,
  refineProducts,
  resolveSearchQuery,
  toNumberOrNull,
} from './productRefine.js'

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
- maxPrice / minPrice: numbers or null. "under $800" / "below 800" / "less than 800" / "under 40" => maxPrice 800 or 40. "over $50" => minPrice 50. "between 20 and 100" => minPrice 20, maxPrice 100.
- requiredTerms: core product nouns only (e.g. "monitor", "headphones", "pants"). Do NOT put modifiers like "gaming", colors, or brands here.
- optionalTerms: modifiers that boost ranking (e.g. "gaming", "black", "wireless").
- IMPORTANT — current search context: when a Current search query is provided, the user is usually refining those results (price, color, brand, etc.). In that case:
  - Keep searchQuery as the current search query (or a slight improvement that still includes the same product intent).
  - Do NOT replace it with unrelated words like "results", "show", "items", or a different product category.
  - Example: current="headphones", user="show results under 40" => searchQuery="headphones", maxPrice=40.
- Only change to a brand-new searchQuery when the user clearly asks for a different product type.
- If the user wants to reset / clear everything, set clearFilters to true and searchQuery to "".
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

function createChatHandler({ groqApiKey, rapidApiKey }) {
  let groq = null

  function getGroq() {
    if (!groqApiKey) return null
    if (!groq) groq = new Groq({ apiKey: groqApiKey })
    return groq
  }

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
      sendJson(res, 500, {
        error:
          'GROQ_API_KEY is missing. Copy .env.example to .env and add your Groq key.',
        code: 'MISSING_GROQ_KEY',
      })
      return
    }

    if (!rapidApiKey) {
      sendJson(res, 500, {
        error:
          'RAPIDAPI_KEY is missing. Copy .env.example to .env and add your RapidAPI key.',
        code: 'MISSING_RAPIDAPI_KEY',
      })
      return
    }

    try {
      const raw = await readBody(req)
      const body = JSON.parse(raw || '{}')
      const messages = Array.isArray(body.messages) ? body.messages : []
      const currentSearchQuery =
        typeof body.currentSearchQuery === 'string'
          ? body.currentSearchQuery.trim()
          : ''

      if (messages.length === 0) {
        sendJson(res, 400, { error: 'messages are required' })
        return
      }

      const userText = latestUserText(messages)
      const client = getGroq()

      const contextBlock = currentSearchQuery
        ? `Current search query: "${currentSearchQuery}"\nThe user is looking at Amazon results for that query. Treat follow-ups as refinements unless they clearly ask for a different product.\n\n`
        : 'No current search query — start a new Amazon search from the user message.\n\n'

      const completion = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `${contextBlock}Conversation:\n${JSON.stringify(messages)}`,
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
      const searchQuery = resolveSearchQuery({
        parsedQuery: parsed.searchQuery,
        userText,
        currentSearchQuery,
      })

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
        maxPrice: maxPrice ?? undefined,
      })

      // Merge model + text-derived price into refine so "under 40" always sticks
      const products = refineProducts(
        result.products,
        {
          ...parsed,
          minPrice,
          maxPrice,
          requiredTerms:
            Array.isArray(parsed.requiredTerms) && parsed.requiredTerms.length
              ? parsed.requiredTerms
              : searchQuery.split(/\s+/).filter((t) => t.length > 2).slice(0, 2),
        },
        userText,
      )

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
      const message = error?.message || 'Failed to search products'
      sendJson(res, error.status || 500, {
        error: message,
        code: /too many requests/i.test(message)
          ? 'RATE_LIMITED'
          : /not subscribed/i.test(message)
            ? 'NOT_SUBSCRIBED'
            : undefined,
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
