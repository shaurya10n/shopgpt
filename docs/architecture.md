# Architecture notes

## Request paths

### Homepage / `?q=` search

1. UI calls `GET /api/products?query=...`
2. `server/amazonClient.js` hits RapidAPI `GET /search`
3. Results are normalized to `{ id, title, price, image, rating, productUrl, ... }`
4. `ProductsContext` stores the list for the grid

### Chat

1. UI posts conversation to `POST /api/chat`
2. Groq returns structured intent (`searchQuery`, `maxPrice`, terms, …)
3. Server searches Amazon with that query (and optional price params)
4. `refineProducts` drops anything that violates hard price rules / terms
5. UI replaces the product list via `replaceProducts`

## Why refine on the server?

LLMs occasionally include over-budget items. Deterministic checks in `productRefine.js` keep constraints honest (e.g. “under $800” never shows a $999.99 monitor).

## Secrets

`GROQ_API_KEY` and `RAPIDAPI_KEY` are read with Vite `loadEnv` in `vite.config.js` and only used inside Node middleware. They are not prefixed with `VITE_`, so they are not exposed to the browser bundle.
