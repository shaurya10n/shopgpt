import { useEffect } from 'react'

export default function ProductModal({ product, onClose }) {
  useEffect(() => {
    if (!product) return

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [product, onClose])

  if (!product) return null

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(product.price)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close details"
        onClick={onClose}
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="grid gap-0 sm:grid-cols-2">
          <div className="aspect-square bg-neutral-50 sm:aspect-auto sm:min-h-[320px]">
            <img
              src={product.image}
              alt={product.title}
              className="h-full w-full object-contain p-8"
            />
          </div>

          <div className="flex flex-col p-6 sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                  {product.category}
                </p>
                <h2
                  id="product-modal-title"
                  className="text-xl font-semibold leading-snug tracking-tight text-neutral-900"
                >
                  {product.title}
                </h2>
                <p className="text-lg font-semibold text-neutral-800">{formattedPrice}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            <div className="flex-1">
              <h3 className="mb-2 text-sm font-medium text-neutral-900">Description</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-600">
                {product.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
