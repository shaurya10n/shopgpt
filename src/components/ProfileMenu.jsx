import { useEffect, useId, useRef, useState } from 'react'

const MOCK_USER = {
  name: 'Alex Morgan',
  email: 'alex@shopgpt.com',
}

export default function ProfileMenu({ className = '' }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return

    function onPointerDown(e) {
      if (!containerRef.current?.contains(e.target)) {
        setOpen(false)
      }
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-ink)] transition-colors hover:bg-black/5"
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
          <circle cx="12" cy="8" r="3.25" />
          <path d="M5.5 19.5c1.6-3.2 4-4.8 6.5-4.8s4.9 1.6 6.5 4.8" />
        </svg>
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 origin-top-right overflow-hidden rounded-xl border border-neutral-200/80 bg-white/95 shadow-[0_8px_30px_rgba(26,31,28,0.12)] backdrop-blur-md"
        >
          <div className="border-b border-neutral-100 px-4 py-3.5">
            <p className="text-sm font-medium text-neutral-900">{MOCK_USER.name}</p>
            <p className="mt-0.5 truncate text-xs text-neutral-500">{MOCK_USER.email}</p>
          </div>
          <div className="p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
