import { Link } from 'react-router-dom'
import { useFavorites } from '../context/FavoritesContext'

export default function FavoritesLink({ className = '' }) {
  const { favoriteCount } = useFavorites()

  return (
    <Link
      to="/favorites"
      aria-label={
        favoriteCount > 0 ? `Favorites, ${favoriteCount} items` : 'Favorites'
      }
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-ink)] transition-colors hover:bg-black/5 ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M12 20.5s-7.5-4.4-7.5-10A4.5 4.5 0 0 1 12 7.2 4.5 4.5 0 0 1 19.5 10.5c0 5.6-7.5 10-7.5 10Z" />
      </svg>
      {favoriteCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4.5 items-center justify-center rounded-md bg-[var(--color-ink)] px-1 py-px text-[10px] font-semibold leading-none text-white">
          {favoriteCount > 99 ? '99+' : favoriteCount}
        </span>
      )}
    </Link>
  )
}
