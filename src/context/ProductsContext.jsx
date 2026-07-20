import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const ProductsContext = createContext(null)

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [activeQuery, setActiveQuery] = useState('')
  const [chatMatchedIds, setChatMatchedIds] = useState(null)
  const [chatFilterLabel, setChatFilterLabel] = useState('')
  const requestIdRef = useRef(0)

  const searchProducts = useCallback(async (query, { signal } = {}) => {
    const nextQuery = (query || '').trim()
    if (!nextQuery) {
      requestIdRef.current += 1
      setProducts([])
      setActiveQuery('')
      setStatus('idle')
      setError(null)
      setChatMatchedIds(null)
      setChatFilterLabel('')
      return []
    }

    const requestId = ++requestIdRef.current
    setStatus('loading')
    setError(null)
    setChatMatchedIds(null)
    setChatFilterLabel('')

    try {
      const params = new URLSearchParams({ query: nextQuery })
      const response = await fetch(`/api/products?${params}`, { signal })
      const data = await response.json()

      if (requestId !== requestIdRef.current) return []

      if (!response.ok) {
        throw new Error(data.error || `Failed to load products (${response.status})`)
      }

      setProducts(Array.isArray(data.products) ? data.products : [])
      setActiveQuery(nextQuery)
      setStatus('ready')
      return data.products || []
    } catch (err) {
      if (err.name === 'AbortError') {
        // A newer search or unmount aborted this request — don't leave UI stuck.
        return []
      }
      if (requestId !== requestIdRef.current) return []
      setError(err.message || 'Something went wrong')
      setStatus('error')
      setProducts([])
      setActiveQuery(nextQuery)
      throw err
    }
  }, [])

  const value = useMemo(
    () => ({
      products,
      status,
      error,
      activeQuery,
      chatMatchedIds,
      chatFilterLabel,
      searchProducts,
      replaceProducts(nextProducts, { query, label } = {}) {
        requestIdRef.current += 1
        const list = Array.isArray(nextProducts) ? nextProducts : []
        setProducts(list)
        setError(null)
        setActiveQuery(query || '')
        setChatMatchedIds(null)
        setChatFilterLabel(label || '')
        setStatus(list.length || query ? 'ready' : 'idle')
      },
      applyChatFilter(ids, label) {
        setChatMatchedIds(ids)
        setChatFilterLabel(label || '')
      },
      clearChatFilter() {
        setChatMatchedIds(null)
        setChatFilterLabel('')
      },
    }),
    [
      products,
      status,
      error,
      activeQuery,
      chatMatchedIds,
      chatFilterLabel,
      searchProducts,
    ],
  )

  return (
    <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>
  )
}

export function useProducts() {
  const context = useContext(ProductsContext)
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider')
  }
  return context
}
