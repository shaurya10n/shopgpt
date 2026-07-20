import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { groqChatPlugin } from './server/groqChatPlugin.js'
import { amazonProductsPlugin } from './server/amazonProductsPlugin.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      amazonProductsPlugin(env.RAPIDAPI_KEY),
      groqChatPlugin({
        groqApiKey: env.GROQ_API_KEY,
        rapidApiKey: env.RAPIDAPI_KEY,
      }),
    ],
  }
})
