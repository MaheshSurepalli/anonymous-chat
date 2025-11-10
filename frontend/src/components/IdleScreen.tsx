import { useEffect, useState } from 'react'
import { ArrowRightIcon } from '@heroicons/react/24/solid'
import { useChatStore } from '../state/useChatStore'

const QUOTES = [
  'Maybe they’re cool. Maybe they’re chaos.',
  'Someone new. Zero context. Infinite vibe.',
  'Say hi. Worst case? A story.',
  'No socials. No receipts. Just talk.',
  'Vibe check: pending.',
  'Two bubbles. One spark.',
  'Anonymous. Curious. Kinda exciting.',
  'New chat, new energy.'
]

export default function IdleScreen() {
  const { connectAndFind, queueSize } = useChatStore()
  const [i, setI] = useState(0)

  // Rotate quote every ~4s (simple, no dependencies)
  useEffect(() => {
    const id = window.setInterval(() => setI((x) => (x + 1) % QUOTES.length), 4000)
    return () => clearInterval(id)
  }, [])

  return (
    <main className="flex-1 grid place-items-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <p
          className="text-lg md:text-xl text-zinc-700 dark:text-zinc-300 transition-opacity duration-500"
          key={i} // causes a soft fade each swap
        >
          {QUOTES[i]}
        </p>

        {typeof queueSize === 'number' && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 select-none">
            ~{queueSize} waiting
          </p>
        )}

        <button
          onClick={connectAndFind}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3
                     bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900
                     hover:opacity-90 focus:outline-none focus:ring-2"
          aria-label="Find a stranger to chat"
        >
          Find Stranger
          <ArrowRightIcon className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </main>
  )
}
