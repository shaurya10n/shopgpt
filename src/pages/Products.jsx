import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import HeaderActions from '../components/HeaderActions'
import { useProducts } from '../context/ProductsContext'

export default function Products() {
  const [searchParams] = useSearchParams()
  const query = (searchParams.get('q') || '').trim()
  const {
    products,
    status,
    error,
    chatMatchedIds,
    chatFilterLabel,
    clearChatFilter,
    searchProducts,
  } = useProducts()

  useEffect(() => {
    if (!query) return

    const controller = new AbortController()
    searchProducts(query, { signal: controller.signal }).catch(() => {
      // Errors are stored on context; aborts are ignored.
    })
    return () => controller.abort()
  }, [query, searchProducts])

  const filtered = useMemo(() => {
    if (!chatMatchedIds) return products
    const byId = new Map(products.map((product) => [product.id, product]))
    return chatMatchedIds.map((id) => byId.get(id)).filter(Boolean)
  }, [products, chatMatchedIds])

  const heading = chatFilterLabel
    ? `Results for “${chatFilterLabel}”`
    : query
      ? `Results for “${query}”`
      : 'Products'

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 sm:py-16 lg:px-10">
        <header className="mb-12 flex items-start justify-between gap-4 sm:mb-16">
          <div>
            <Link
              to="/"
              className="mb-6 inline-block font-display text-2xl tracking-tight text-[var(--color-ink)] transition-opacity hover:opacity-70"
            >
              ShopGPT
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              {heading}
            </h1>
            <p className="mt-2 text-sm text-neutral-500 sm:text-base">
              {status === 'ready'
                ? `${filtered.length} Amazon item${filtered.length === 1 ? '' : 's'}`
                : status === 'loading'
                  ? 'Searching Amazon…'
                  : status === 'idle'
                    ? 'Search or chat to find products'
                    : 'Amazon via RapidAPI'}
            </p>
            {chatFilterLabel && (
              <button
                type="button"
                onClick={clearChatFilter}
                className="mt-3 text-sm text-neutral-600 underline underline-offset-2 transition-colors hover:text-neutral-900"
              >
                Clear chat label
              </button>
            )}
          </div>
          <HeaderActions className="pt-1" />
        </header>

        {status === 'idle' && (
          <p className="text-sm text-neutral-500">
            Search from the homepage or ask ShopGPT to find Amazon products.
          </p>
        )}

        {status === 'loading' && (
          <p className="text-sm text-neutral-500">Loading Amazon products…</p>
        )}

        {status === 'error' && (
          <div className="max-w-xl space-y-2" role="alert">
            <p className="text-sm text-red-600">{error}</p>
            {String(error || '').toLowerCase().includes('not subscribed') && (
              <p className="text-sm text-neutral-500">
                Subscribe to{' '}
                <a
                  href="https://rapidapi.com/letscrape-6bRBa3QguO5/api/real-time-amazon-data"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  Real-Time Amazon Data
                </a>{' '}
                on RapidAPI, then restart the dev server.
              </p>
            )}
            {String(error || '').toLowerCase().includes('too many requests') && (
              <p className="text-sm text-neutral-500">
                RapidAPI rate limit hit — wait a moment and try again.
              </p>
            )}
            <button
              type="button"
              onClick={() => query && searchProducts(query)}
              className="text-sm font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
            >
              Try again
            </button>
          </div>
        )}

        {status === 'ready' && filtered.length === 0 && (
          <p className="text-sm text-neutral-500">
            No products matched. Try another search from the homepage or chat.
          </p>
        )}

        {status === 'ready' && filtered.length > 0 && (
          <section
            className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            aria-label="Product grid"
          >
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
