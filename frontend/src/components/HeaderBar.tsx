import { useEffect, useMemo, useState } from 'react'
import { useChatStore } from '../state/useChatStore'
import { toggleTheme } from '../utils/theme'
import {
  MoonIcon,
  SunIcon,
  ArrowPathIcon,
  StopCircleIcon,
} from '@heroicons/react/24/solid'
import ConfirmDialog from './ConfirmDialog'

export default function HeaderBar() {
  const { status, partner, startedAt, next, leave } = useChatStore()
  const [activeDialog, setActiveDialog] = useState<'next' | 'end' | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [isDark, setIsDark] = useState<boolean>(() =>
    document.documentElement.classList.contains('dark')
  )

  // keep a lightweight timer for mm:ss
  useEffect(() => {
    if (status !== 'matched' || !startedAt) {
      setNow(Date.now())
      return
    }

    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [status, startedAt])

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
    const secs = Math.max(0, Math.floor((now - startedAt) / 1000))
    const mm = String(Math.floor(secs / 60)).padStart(2, '0')
    const ss = String(secs % 60).padStart(2, '0')
    return `${mm}:${ss}`
  }, [startedAt, now])

  const iconButtonBase =
    'p-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 transition-colors'

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
              onClick={() => toggleTheme()}
              aria-label="Toggle theme"
              title="Toggle theme"
              className={`${iconButtonBase} border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800`}
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
                  onClick={() => setActiveDialog('next')}
                  aria-label="Next stranger"
                  title="Next stranger"
                  className={`${iconButtonBase} bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200`}
                >
                  <ArrowPathIcon className="h-5 w-5" aria-hidden />
                </button>

                {/* End Conversation (icon) */}
                <button
                  onClick={() => setActiveDialog('end')}
                  aria-label="End conversation"
                  title="End conversation"
                  className={`${iconButtonBase} border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800`}
                >
                  <StopCircleIcon className="h-5 w-5" aria-hidden />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <ConfirmDialog
        open={activeDialog === 'next'}
        onOpenChange={(open) => setActiveDialog(open ? 'next' : null)}
        title="Find next stranger?"
        description="Your current chat will end and you’ll return to the queue."
        confirmLabel="Find Next"
        onConfirm={() => next()}
      />

      <ConfirmDialog
        open={activeDialog === 'end'}
        onOpenChange={(open) => setActiveDialog(open ? 'end' : null)}
        title="End conversation?"
        description="You’ll return to the idle screen."
        confirmLabel="End Chat"
        tone="danger"
        onConfirm={() => leave()}
      />
    </>
  )
}
