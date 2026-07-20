import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const FavoritesContext = createContext(null)
const STORAGE_KEY = 'shopgpt-favorites'

function loadFavorites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function FavoritesProvider({ children }) {
  const [items, setItems] = useState(loadFavorites)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const value = useMemo(() => {
    const favoriteCount = items.length
    const favoriteIds = new Set(items.map((item) => item.id))

    function isFavorite(id) {
      return favoriteIds.has(id)
    }

    function toggleFavorite(product) {
      setItems((current) => {
        const exists = current.some((item) => item.id === product.id)
        if (exists) {
          return current.filter((item) => item.id !== product.id)
        }
        return [
          ...current,
          {
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            category: product.category,
            description: product.description,
            productUrl: product.productUrl || null,
            source: product.source || 'Amazon',
            rating: product.rating ?? null,
          },
        ]
      })
    }

    function removeFavorite(id) {
      setItems((current) => current.filter((item) => item.id !== id))
    }

    function clearFavorites() {
      setItems([])
    }

    return {
      items,
      favoriteCount,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      clearFavorites,
    }
  }, [items])

  return (
    <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider')
  }
  return context
}
