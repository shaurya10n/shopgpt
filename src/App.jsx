import { useState } from 'react'
import products from '../products.json'
import ProductCard from './components/ProductCard'
import ProductModal from './components/ProductModal'

export default function App() {
  const [selected, setSelected] = useState(null)

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 sm:py-16 lg:px-10">
        <header className="mb-12 sm:mb-16">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            Products
          </h1>
          <p className="mt-2 text-sm text-neutral-500 sm:text-base">
            {products.length} items
          </p>
        </header>

        <section
          className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          aria-label="Product grid"
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onDetails={setSelected}
            />
          ))}
        </section>
      </div>

      <ProductModal product={selected} onClose={() => setSelected(null)} />
    </main>
  )
}
