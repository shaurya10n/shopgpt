import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { ChatProvider, useChat } from './context/ChatContext'
import ChatPanel from './components/ChatPanel'
import ChatToggle from './components/ChatToggle'
import Home from './pages/Home'
import Products from './pages/Products'
import Cart from './pages/Cart'

function AppShell() {
  const { isOpen } = useChat()

  return (
    <div className="flex h-dvh overflow-hidden">
      <div
        className={`min-w-0 flex-1 overflow-y-auto ${isOpen ? 'max-md:hidden' : ''}`}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/cart" element={<Cart />} />
        </Routes>
      </div>
      <ChatPanel />
      <ChatToggle />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <ChatProvider>
          <AppShell />
        </ChatProvider>
      </CartProvider>
    </BrowserRouter>
  )
}
