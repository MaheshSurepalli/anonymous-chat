import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { useChatStore } from '../state/useChatStore'
import useKeyboardOffset from '../hooks/useKeyboardOffset'

export default function MessageList() {
  const { messages } = useChatStore()
  const ref = useRef<HTMLDivElement>(null)
  const keyboardOffset = useKeyboardOffset()
  useEffect(() => { ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' }) }, [messages])
  const bottomPadding = `calc(env(safe-area-inset-bottom) + 1.25rem + ${keyboardOffset}px)`
  const scrollPaddingBottom = `calc(env(safe-area-inset-bottom) + 9rem + ${keyboardOffset}px)`
  return (
    <div
      ref={ref}
      className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
      style={{ paddingBottom: bottomPadding, scrollPaddingBottom }}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
    >
      <AnimatePresence initial={false}>
        {messages.map(m => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={m.mine ? 'text-right' : 'text-left'}>
            <span className={`inline-block max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.mine ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
              {m.text}
            </span>
            <div className="mt-0.5 text-[11px] text-zinc-500">{new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
