import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HeaderActions from '../components/HeaderActions'

export default function Home() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    navigate(`/products?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-[var(--color-mist)]">
      <div
        className="hero-orb pointer-events-none absolute -left-[20%] top-[-30%] h-[70vmax] w-[70vmax] rounded-full bg-[radial-gradient(circle,rgba(95,122,106,0.28)_0%,transparent_68%)]"
        aria-hidden="true"
      />
      <div
        className="hero-orb pointer-events-none absolute -bottom-[25%] -right-[15%] h-[55vmax] w-[55vmax] rounded-full bg-[radial-gradient(circle,rgba(26,31,28,0.08)_0%,transparent_70%)]"
        style={{ animationDelay: '-6s' }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%270 0 200 200%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.85%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E")',
          backgroundSize: '180px 180px',
        }}
        aria-hidden="true"
      />

      <div className="absolute right-6 top-6 z-20 sm:right-8 sm:top-8">
        <HeaderActions />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-3xl px-6 py-20 sm:px-8">
        <p className="animate-fade-up font-display text-5xl leading-none tracking-tight text-[var(--color-ink)] sm:text-7xl md:text-8xl">
          ShopGPT
        </p>

        <p className="animate-fade-up-delay mt-5 max-w-md text-base leading-relaxed text-[var(--color-sage)] sm:text-lg">
          Find what you need — search products in plain language.
        </p>

        <form
          onSubmit={handleSubmit}
          className="animate-search-in mt-10 flex w-full flex-col gap-3 sm:mt-12 sm:flex-row sm:items-stretch"
          role="search"
        >
          <label htmlFor="product-search" className="sr-only">
            Search products
          </label>
          <input
            id="product-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for jackets, jewelry, electronics…"
            className="w-full flex-1 rounded-xl border border-[var(--color-fog)] bg-white/90 px-5 py-3.5 text-base text-[var(--color-ink)] shadow-[0_1px_2px_rgba(26,31,28,0.04)] outline-none backdrop-blur-sm placeholder:text-neutral-400 focus:border-[var(--color-sage)] focus:ring-2 focus:ring-[var(--color-sage)]/20"
            autoComplete="off"
            required
          />
          <button
            type="submit"
            disabled={!query.trim()}
            className="rounded-xl bg-[var(--color-ink)] px-6 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#2a322e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-40 sm:shrink-0"
          >
            Search
          </button>
        </form>
      </div>
    </main>
  )
}
