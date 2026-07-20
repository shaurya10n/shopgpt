export default function ProductCard({ product, onDetails }) {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(product.price)

  return (
    <article className="flex flex-col overflow-hidden rounded-xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] transition-shadow duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.06)]">
      <div className="aspect-square overflow-hidden bg-neutral-50">
        <img
          src={product.image}
          alt={product.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex-1 space-y-1.5">
          <h2 className="line-clamp-2 text-[15px] font-medium leading-snug tracking-tight text-neutral-900">
            {product.title}
          </h2>
          <p className="text-sm font-semibold text-neutral-800">{formattedPrice}</p>
        </div>
        <button
          type="button"
          onClick={() => onDetails(product)}
          className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
        >
          Details
        </button>
      </div>
    </article>
  )
}
