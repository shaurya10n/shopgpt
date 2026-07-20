# ShopGPT

Shopping assistant that searches Amazon via [RapidAPI Real-Time Amazon Data](https://rapidapi.com/letscrape-6bRBa3QguO5/api/real-time-amazon-data) and filters with Groq (`llama-3.3-70b-versatile`).

## Getting started

1. Copy `.env.example` to `.env`
2. Set `GROQ_API_KEY` and `RAPIDAPI_KEY`
3. Subscribe to the RapidAPI Amazon Data API with the same RapidAPI account as your key
4. Install and run:

```bash
npm install
npm run dev
```

Keys stay on the Vite server (`/api/products`, `/api/chat`) — they are not bundled into the client.

## Pages

- **Home** (`/`) — ShopGPT hero with product search
- **Products** (`/products`) — Amazon search results; supports `?q=` and chat-driven searches
- **Favorites** (`/favorites`) — heart products to save them for later
- **Chat** — docked right-side assistant (“Ask ShopGPT”) that searches Amazon from natural language
