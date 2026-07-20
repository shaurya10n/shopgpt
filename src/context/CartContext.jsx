import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'shopgpt-cart'

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const value = useMemo(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    function addItem(product) {
      setItems((current) => {
        const existing = current.find((item) => item.id === product.id)
        if (existing) {
          return current.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          )
        }
        return [
          ...current,
          {
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            quantity: 1,
          },
        ]
      })
    }

    function removeItem(id) {
      setItems((current) => current.filter((item) => item.id !== id))
    }

    function increaseQuantity(id) {
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
        ),
      )
    }

    function decreaseQuantity(id) {
      setItems((current) =>
        current
          .map((item) =>
            item.id === id ? { ...item, quantity: item.quantity - 1 } : item,
          )
          .filter((item) => item.quantity > 0),
      )
    }

    function clearCart() {
      setItems([])
    }

    return {
      items,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
    }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
