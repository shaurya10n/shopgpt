const RAPIDAPI_DOCS =
  'https://rapidapi.com/letscrape-6bRBa3QguO5/api/real-time-amazon-data'

export default function ApiErrorHelp({ error, onRetry }) {
  const message = String(error || '')
  const lower = message.toLowerCase()

  const isMissingKey =
    lower.includes('rapidapi_key') ||
    lower.includes('groq_api_key') ||
    lower.includes('is missing') ||
    lower.includes('not configured')
  const isRateLimited = lower.includes('too many requests')
  const isNotSubscribed = lower.includes('not subscribed')

  return (
    <div className="max-w-xl space-y-2" role="alert">
      <p className="text-sm text-red-600">{message}</p>

      {isMissingKey && (
        <p className="text-sm text-neutral-500">
          Copy <code className="text-neutral-700">.env.example</code> to{' '}
          <code className="text-neutral-700">.env</code>, add your keys, then restart{' '}
          <code className="text-neutral-700">npm run dev</code>.
        </p>
      )}

      {isNotSubscribed && (
        <p className="text-sm text-neutral-500">
          Subscribe to{' '}
          <a
            href={RAPIDAPI_DOCS}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            Real-Time Amazon Data
          </a>{' '}
          on RapidAPI with the same account as your key, then restart the dev server.
        </p>
      )}

      {isRateLimited && (
        <p className="text-sm text-neutral-500">
          RapidAPI rate limit hit — wait a minute and try again. Free tiers are strict.
        </p>
      )}

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm font-medium text-neutral-700 underline underline-offset-2 hover:text-neutral-900"
        >
          Try again
        </button>
      )}
    </div>
  )
}
