/**
 * Warn once at server start if required API keys are missing.
 */
export function envCheckPlugin(env) {
  return {
    name: 'env-check',
    configureServer() {
      const missing = []
      if (!env.GROQ_API_KEY) missing.push('GROQ_API_KEY')
      if (!env.RAPIDAPI_KEY) missing.push('RAPIDAPI_KEY')

      if (missing.length) {
        console.warn(
          `\n[shopgpt] Missing ${missing.join(' and ')}.\n` +
            `Copy .env.example to .env and add your keys before searching or chatting.\n`,
        )
      }
    },
  }
}
