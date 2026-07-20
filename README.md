# ShopGPT

Shopping platform with an AI chatbot for filtering results. Built with React and Tailwind CSS.

## Getting started

```bash
npm install
npm run dev
```

## Pages

- **Home** (`/`) — ShopGPT hero with product search
- **Products** (`/products`) — responsive grid from the [Fake Store API](https://fakestoreapi.com/); supports `?q=` search filtering
- **Cart** (`/cart`) — add/remove items, adjust quantities, view total
- **Chat** — docked right-side assistant that pushes the page layout; open via the “Ask ShopGPT” tab (UI only; Groq filtering coming next)
