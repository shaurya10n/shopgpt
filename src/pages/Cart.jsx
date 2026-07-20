import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatPrice } from '../utils/formatPrice'
import HeaderActions from '../components/HeaderActions'

export default function Cart() {
  const {
    items,
    itemCount,
    subtotal,
    removeItem,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
  } = useCart()

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-12 sm:px-8 sm:py-16">
        <header className="mb-10 flex items-start justify-between gap-4 sm:mb-12">
          <div>
            <Link
              to="/"
              className="mb-6 inline-block font-display text-2xl tracking-tight text-[var(--color-ink)] transition-opacity hover:opacity-70"
            >
              ShopGPT
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              Cart
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              {itemCount === 0
                ? 'Your cart is empty'
                : `${itemCount} item${itemCount === 1 ? '' : 's'}`}
            </p>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Link
              to="/products"
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
            >
              Products
            </Link>
            <HeaderActions />
          </div>
        </header>

        {items.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-500">
              Browse products and add something to get started.
            </p>
            <Link
              to="/products"
              className="inline-flex rounded-lg bg-[var(--color-ink)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2a322e]"
            >
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            <ul className="divide-y divide-neutral-100 border-y border-neutral-100">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 py-6 sm:gap-6">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-50 sm:h-28 sm:w-28">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-contain p-3"
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="line-clamp-2 text-sm font-medium leading-snug text-neutral-900 sm:text-[15px]">
                          {item.title}
                        </h2>
                        <p className="mt-1 text-sm text-neutral-600">
                          {formatPrice(item.price)} each
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-neutral-900">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center rounded-lg border border-neutral-200">
                        <button
                          type="button"
                          onClick={() => decreaseQuantity(item.id)}
                          className="px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
                          aria-label={`Decrease quantity of ${item.title}`}
                        >
                          −
                        </button>
                        <span className="min-w-8 px-2 text-center text-sm font-medium text-neutral-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => increaseQuantity(item.id)}
                          className="px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
                          aria-label={`Increase quantity of ${item.title}`}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-sm text-neutral-500 underline-offset-2 transition-colors hover:text-neutral-800 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <button
                type="button"
                onClick={clearCart}
                className="self-start text-sm text-neutral-500 underline-offset-2 transition-colors hover:text-neutral-800 hover:underline"
              >
                Clear cart
              </button>

              <div className="sm:text-right">
                <p className="text-sm text-neutral-500">Total</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
                  {formatPrice(subtotal)}
                </p>
                <Link
                  to="/products"
                  className="mt-4 inline-flex rounded-lg border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50"
                >
                  Continue shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
