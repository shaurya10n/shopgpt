import { useChat } from '../context/ChatContext'

export default function ChatToggle() {
  const { isOpen, openChat } = useChat()

  if (isOpen) return null

  return (
    <button
      type="button"
      onClick={openChat}
      aria-label="Open ShopGPT assistant"
      className="fixed right-0 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-3 rounded-l-2xl bg-[var(--color-ink)] px-3.5 py-6 text-white shadow-[-6px_0_24px_rgba(26,31,28,0.18)] transition-[padding,background-color] duration-200 hover:bg-[#2a322e] hover:pr-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ink)]"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path d="M7 8.5h10M7 12h6" />
          <path d="M5.5 4.5h13a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H11l-4.5 3v-3H5.5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z" />
        </svg>
      </span>
      <span
        className="font-display text-[1.35rem] leading-none tracking-wide"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
      >
        Ask ShopGPT
      </span>
    </button>
  )
}
