import { useFavorites } from '../context/FavoritesContext'
import { formatPrice } from '../utils/formatPrice'

function HeartIcon({ filled, className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 20.5s-7.5-4.4-7.5-10A4.5 4.5 0 0 1 12 7.2 4.5 4.5 0 0 1 19.5 10.5c0 5.6-7.5 10-7.5 10Z" />
    </svg>
  )
}

function StarRating({ rating }) {
  const value = Number(rating)
  if (!Number.isFinite(value) || value <= 0) return null

  const clamped = Math.min(5, Math.max(0, value))
  const fullStars = Math.floor(clamped)
  const hasHalf = clamped - fullStars >= 0.25 && clamped - fullStars < 0.75
  const roundedHalfUp = clamped - fullStars >= 0.75
  const filled = roundedHalfUp ? fullStars + 1 : fullStars

  return (
    <div
      className="flex items-center gap-1.5"
      aria-label={`${clamped.toFixed(1)} out of 5 stars`}
    >
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => {
          const starNumber = index + 1
          const isFilled = starNumber <= filled
          const isHalf = !roundedHalfUp && hasHalf && starNumber === fullStars + 1

          return (
            <span key={starNumber} className="relative h-3.5 w-3.5">
              <svg
                viewBox="0 0 20 20"
                className="absolute inset-0 h-3.5 w-3.5 text-neutral-200"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {(isFilled || isHalf) && (
                <svg
                  viewBox="0 0 20 20"
                  className="absolute inset-0 h-3.5 w-3.5 text-amber-500"
                  fill="currentColor"
                  style={isHalf ? { clipPath: 'inset(0 50% 0 0)' } : undefined}
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
            </span>
          )
        })}
      </div>
      <span className="text-xs font-medium text-neutral-600">{clamped.toFixed(1)}</span>
    </div>
  )
}

export default function ProductCard({ product }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const favorited = isFavorite(product.id)

  return (
    <article className="flex flex-col overflow-hidden rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] transition-shadow duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.06)]">
      <div className="relative aspect-square overflow-hidden bg-neutral-50">
        <img
          src={product.image}
          alt={product.title}
          className="h-full w-full object-contain p-6"
          loading="lazy"
        />
        <button
          type="button"
          onClick={() => toggleFavorite(product)}
          className={`absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-sm transition-colors hover:bg-white ${
            favorited ? 'text-red-500' : 'text-neutral-500 hover:text-red-500'
          }`}
          aria-label={
            favorited
              ? `Remove ${product.title} from favorites`
              : `Save ${product.title} to favorites`
          }
          aria-pressed={favorited}
        >
          <HeartIcon filled={favorited} className="h-5 w-5" />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex-1 space-y-1.5">
          <h2 className="line-clamp-2 text-[15px] font-medium leading-snug tracking-tight text-neutral-900">
            {product.title}
          </h2>
          <StarRating rating={product.rating} />
          <p className="text-sm font-semibold text-neutral-800">
            {formatPrice(product.price)}
          </p>
        </div>
        {product.productUrl ? (
          <a
            href={product.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full rounded-lg bg-[var(--color-ink)] px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-[#2a322e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
          >
            Take me there
          </a>
        ) : (
          <p className="text-center text-sm text-neutral-400">Listing unavailable</p>
        )}
      </div>
    </article>
  )
}
