import { useEffect, useMemo, useState } from 'react'
import { useChatStore } from '../state/useChatStore'
import { toggleTheme } from '../utils/theme'
import {
  MoonIcon,
  SunIcon,
  ArrowPathIcon,
  StopCircleIcon,
} from '@heroicons/react/24/solid'

export default function HeaderBar() {
  const { status, partner, startedAt, next, leave } = useChatStore()
  const [confirmNextOpen, setConfirmNextOpen] = useState(false)
  const [confirmEndOpen, setConfirmEndOpen] = useState(false)
  const [tick, setTick] = useState(0)
  const [isDark, setIsDark] = useState<boolean>(() =>
    document.documentElement.classList.contains('dark')
  )

  // keep a lightweight timer for mm:ss
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // reflect theme changes in icon
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  const timer = useMemo(() => {
    if (!startedAt || Number.isNaN(startedAt)) return null
    const secs = Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
    const mm = String(Math.floor(secs / 60)).padStart(2, '0')
    const ss = String(secs % 60).padStart(2, '0')
    return `${mm}:${ss}`
  }, [startedAt, tick])

  return (
    <>
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b border-zinc-200 dark:bg-zinc-900/70 dark:border-zinc-800">
        <div className="mx-auto max-w-2xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold">Stranger Chat</span>
            {status === 'matched' && partner && (
              <span className="text-sm text-zinc-600 dark:text-zinc-300">
                {partner.avatar} • {timer ?? '--:--'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Theme icon button */}
            <button
              onClick={() => { toggleTheme(); setIsDark(!isDark) }}
              aria-label="Toggle theme"
              title="Toggle theme"
              className="p-2 rounded-xl border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              {isDark ? (
                <SunIcon className="h-5 w-5" aria-hidden />
              ) : (
                <MoonIcon className="h-5 w-5" aria-hidden />
              )}
            </button>

            {/* Show chat actions only when matched */}
            {status === 'matched' && (
              <div className="flex items-center gap-2">
                {/* Next Stranger (icon) */}
                <button
                  onClick={() => setConfirmNextOpen(true)}
                  aria-label="Next stranger"
                  title="Next stranger"
                  className="p-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 focus:outline-none focus:ring-2 hover:opacity-90"
                >
                  <ArrowPathIcon className="h-5 w-5" aria-hidden />
                </button>

                {/* End Conversation (icon) */}
                <button
                  onClick={() => setConfirmEndOpen(true)}
                  aria-label="End conversation"
                  title="End conversation"
                  className="p-2 rounded-xl border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <StopCircleIcon className="h-5 w-5" aria-hidden />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {confirmNextOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <button
            aria-hidden
            onClick={() => setConfirmNextOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div
            role="dialog"
            aria-modal
            aria-labelledby="next-title"
            className="relative w-full max-w-sm rounded-2xl bg-white p-4 shadow-lg outline-none dark:bg-zinc-800"
          >
            <h2 id="next-title" className="text-lg font-semibold">Find next stranger?</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Your current chat will end.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setConfirmNextOpen(false)} className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700">Cancel</button>
              <button onClick={() => { setConfirmNextOpen(false); next() }} className="px-3 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm: End Conversation (now OUTSIDE header) */}
      {confirmEndOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <button
            aria-hidden
            onClick={() => setConfirmEndOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div
            role="dialog"
            aria-modal
            aria-labelledby="end-title"
            className="relative w-full max-w-sm rounded-2xl bg-white p-4 shadow-lg outline-none dark:bg-zinc-800"
          >
            <h2 id="end-title" className="text-lg font-semibold">End conversation?</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">You’ll return to Idle.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setConfirmEndOpen(false)} className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700">Cancel</button>
              <button onClick={() => { setConfirmEndOpen(false); leave() }} className="px-3 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">End</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
