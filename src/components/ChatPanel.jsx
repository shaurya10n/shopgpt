import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChat } from '../context/ChatContext'
import { useProducts } from '../context/ProductsContext'
import ApiErrorHelp from './ApiErrorHelp'

const INITIAL_MESSAGES = [
  {
    id: 'welcome',
    role: 'assistant',
    text: 'Hi — tell me what you’re shopping for on Amazon. Try “gaming monitor under $800” or “wireless headphones”.',
  },
]

export default function ChatPanel() {
  const navigate = useNavigate()
  const { isOpen, closeChat } = useChat()
  const { replaceProducts, clearChatFilter } = useProducts()
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [draft, setDraft] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [error, setError] = useState(null)
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeChat()
    }

    window.addEventListener('keydown', onKeyDown)
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 180)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.clearTimeout(focusTimer)
    }
  }, [isOpen, closeChat])

  useEffect(() => {
    if (!isOpen) return
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, isOpen, isThinking])

  async function handleSubmit(e) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || isThinking) return

    const userMessage = { id: `user-${Date.now()}`, role: 'user', text }
    const nextMessages = [...messages, userMessage]

    setMessages(nextMessages)
    setDraft('')
    setError(null)
    setIsThinking(true)

    try {
      const history = nextMessages
        .filter((message) => message.role === 'user' || message.role === 'assistant')
        .filter((message) => message.id !== 'welcome')
        .map((message) => ({ role: message.role, content: message.text }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.length ? history : [{ role: 'user', content: text }],
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Chat request failed')
      }

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: data.message,
        },
      ])

      if (data.clearFilters) {
        clearChatFilter()
        replaceProducts([], { query: '', label: '' })
      } else {
        replaceProducts(data.products || [], {
          query: data.searchQuery || text,
          label: text,
        })
      }

      navigate('/products')
    } catch (err) {
      const message = err.message || 'Something went wrong talking to ShopGPT'
      setError(message)
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          text: `Sorry — I couldn’t complete that search. ${message}`,
        },
      ])
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <aside
      className={`flex h-full shrink-0 flex-col overflow-hidden border-l border-neutral-200/80 bg-white transition-[width] duration-300 ease-out ${
        isOpen ? 'w-full md:w-[400px] lg:w-[420px]' : 'w-0 border-l-0'
      }`}
      aria-labelledby={titleId}
      aria-hidden={!isOpen}
      inert={!isOpen ? true : undefined}
    >
      <div className="flex h-full w-full min-w-[min(100%,400px)] flex-col md:min-w-[400px] lg:min-w-[420px]">
        <header className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
          <div>
            <p
              id={titleId}
              className="font-display text-xl tracking-tight text-[var(--color-ink)]"
            >
              ShopGPT
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">Amazon shopping assistant</p>
          </div>
          <button
            type="button"
            onClick={closeChat}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800"
            aria-label="Close chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </header>

        <div
          ref={listRef}
          className="flex-1 space-y-4 overflow-y-auto px-5 py-5"
          aria-live="polite"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'rounded-br-md bg-[var(--color-ink)] text-white'
                    : 'rounded-bl-md bg-[var(--color-mist)] text-neutral-800'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-[var(--color-mist)] px-3.5 py-2.5 text-sm text-neutral-500">
                Searching Amazon…
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-neutral-100 bg-white p-4"
        >
          {error && (
            <div className="mb-3 px-1">
              <ApiErrorHelp error={error} />
            </div>
          )}
          <div className="flex items-end gap-2 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-2 focus-within:border-[var(--color-sage)] focus-within:ring-2 focus-within:ring-[var(--color-sage)]/15">
            <label htmlFor="chat-input" className="sr-only">
              Message ShopGPT
            </label>
            <textarea
              id="chat-input"
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  e.currentTarget.form?.requestSubmit()
                }
              }}
              placeholder="e.g. gaming monitor under $800"
              disabled={isThinking}
              className="max-h-28 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!draft.trim() || isThinking}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-ink)] text-white transition-colors hover:bg-[#2a322e] disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Send message"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M3.1 2.8a.75.75 0 0 1 .8-.1l13 6.25a.75.75 0 0 1 0 1.35l-13 6.25a.75.75 0 0 1-1.07-.85L4.7 10.5 2.83 3.55a.75.75 0 0 1 .27-.75Z" />
              </svg>
            </button>
          </div>
          <p className="mt-2 px-1 text-[11px] text-neutral-400">
            Powered by Groq + RapidAPI Amazon data
          </p>
        </form>
      </div>
    </aside>
  )
}
