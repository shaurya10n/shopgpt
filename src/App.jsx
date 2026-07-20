import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { FavoritesProvider } from './context/FavoritesContext'
import { ChatProvider, useChat } from './context/ChatContext'
import { ProductsProvider } from './context/ProductsContext'
import ChatPanel from './components/ChatPanel'
import ChatToggle from './components/ChatToggle'
import Home from './pages/Home'
import Products from './pages/Products'
import Favorites from './pages/Favorites'

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
          <Route path="/favorites" element={<Favorites />} />
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
      <FavoritesProvider>
        <ProductsProvider>
          <ChatProvider>
            <AppShell />
          </ChatProvider>
        </ProductsProvider>
      </FavoritesProvider>
    </BrowserRouter>
  )
}
