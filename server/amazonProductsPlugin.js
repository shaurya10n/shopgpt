import { searchAmazonProducts } from './amazonClient.js'

function sendJson(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

function createProductsHandler(apiKey) {
  return async function productsHandler(req, res, next) {
    const url = new URL(req.url || '/', 'http://localhost')
    if (url.pathname !== '/api/products') {
      next()
      return
    }

    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.end()
      return
    }

    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'Method not allowed' })
      return
    }

    try {
      const query = url.searchParams.get('query') || 'electronics'
      const page = Number(url.searchParams.get('page') || 1)
      const minPrice = url.searchParams.get('min_price')
      const maxPrice = url.searchParams.get('max_price')

      const result = await searchAmazonProducts({
        apiKey,
        query,
        page,
        minPrice: minPrice != null ? Number(minPrice) : undefined,
        maxPrice: maxPrice != null ? Number(maxPrice) : undefined,
      })

      sendJson(res, 200, result)
    } catch (error) {
      console.error('[api/products]', error)
      sendJson(res, error.status || 500, {
        error: error.message || 'Failed to fetch Amazon products',
        details: error.payload || undefined,
      })
    }
  }
}

export function amazonProductsPlugin(apiKey) {
  const handler = createProductsHandler(apiKey)

  return {
    name: 'amazon-products-api',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}
