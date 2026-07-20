import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import ProductModal from '../components/ProductModal'
import HeaderActions from '../components/HeaderActions'

const PRODUCTS_URL = 'https://fakestoreapi.com/products'

export default function Products() {
  const [searchParams] = useSearchParams()
  const query = (searchParams.get('q') || '').trim()

  const [products, setProducts] = useState([])
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      try {
        setStatus('loading')
        setError(null)

        const response = await fetch(PRODUCTS_URL, { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`Failed to load products (${response.status})`)
        }

        const data = await response.json()
        setProducts(data)
        setStatus('ready')
      } catch (err) {
        if (err.name === 'AbortError') return
        setError(err.message || 'Something went wrong')
        setStatus('error')
      }
    }

    loadProducts()
    return () => controller.abort()
  }, [])

  const filtered = useMemo(() => {
    if (!query) return products
    const needle = query.toLowerCase()
    return products.filter((product) => {
      const haystack = [product.title, product.description, product.category]
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })
  }, [products, query])

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
              {query ? `Results for “${query}”` : 'Products'}
            </h1>
            <p className="mt-2 text-sm text-neutral-500 sm:text-base">
              {status === 'ready'
                ? `${filtered.length} item${filtered.length === 1 ? '' : 's'}`
                : 'From Fake Store API'}
            </p>
          </div>
          <HeaderActions className="pt-1" />
        </header>

        {status === 'loading' && (
          <p className="text-sm text-neutral-500">Loading products…</p>
        )}

        {status === 'error' && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {status === 'ready' && filtered.length === 0 && (
          <p className="text-sm text-neutral-500">
            No products matched your search.{' '}
            <Link to="/products" className="underline underline-offset-2 hover:text-neutral-800">
              View all
            </Link>
          </p>
        )}

        {status === 'ready' && filtered.length > 0 && (
          <section
            className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            aria-label="Product grid"
          >
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onDetails={setSelected}
              />
            ))}
          </section>
        )}
      </div>

      <ProductModal product={selected} onClose={() => setSelected(null)} />
    </main>
  )
}
