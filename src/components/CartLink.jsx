import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function CartLink({ className = '' }) {
  const { itemCount } = useCart()

  return (
    <Link
      to="/cart"
      aria-label={itemCount > 0 ? `Cart, ${itemCount} items` : 'Cart'}
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
        <circle cx="9" cy="20" r="1.25" fill="currentColor" stroke="none" />
        <circle cx="17" cy="20" r="1.25" fill="currentColor" stroke="none" />
        <path d="M3 4h2l1.6 9.2a2 2 0 0 0 2 1.7h7.7a2 2 0 0 0 2-1.6L20 8H7" />
      </svg>
      {itemCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4.5 items-center justify-center rounded-md bg-[var(--color-ink)] px-1 py-px text-[10px] font-semibold leading-none text-white">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  )
}
