import { Link } from 'react-router-dom'
import { useFavorites } from '../context/FavoritesContext'
import HeaderActions from '../components/HeaderActions'
import ProductCard from '../components/ProductCard'

export default function Favorites() {
  const { items, favoriteCount, clearFavorites } = useFavorites()

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
              Favorites
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              {favoriteCount === 0
                ? 'No saved products yet'
                : `${favoriteCount} saved item${favoriteCount === 1 ? '' : 's'}`}
            </p>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Link
              to="/"
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
            >
              Search
            </Link>
            <HeaderActions />
          </div>
        </header>

        {items.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-500">
              Heart products while browsing to save them here.
            </p>
            <Link
              to="/"
              className="inline-flex rounded-lg bg-[var(--color-ink)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2a322e]"
            >
              Search products
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <button
              type="button"
              onClick={clearFavorites}
              className="text-sm text-neutral-500 underline-offset-2 transition-colors hover:text-neutral-800 hover:underline"
            >
              Clear all
            </button>

            <section
              className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              aria-label="Favorite products"
            >
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
