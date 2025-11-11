import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '../state/useChatStore'
import useKeyboardOffset from '../hooks/useKeyboardOffset'

export default function MessageList() {
  const { messages, setMessageReaction } = useChatStore()
  const ref = useRef<HTMLDivElement>(null)
  const longPressTimer = useRef<number>()
  const [pickerFor, setPickerFor] = useState<string | null>(null)
  const keyboardOffset = useKeyboardOffset()
  useEffect(() => { ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' }) }, [messages])
  const bottomPadding = `calc(env(safe-area-inset-bottom) + 1.25rem + ${keyboardOffset}px)`
  const scrollPaddingBottom = `calc(env(safe-area-inset-bottom) + 9rem + ${keyboardOffset}px)`
  const reactionOptions = ['👍', '😂', '❤️', '😮']
  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = undefined
    }
  }
  return (
    <div
      ref={ref}
      className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
      style={{ paddingBottom: bottomPadding, scrollPaddingBottom }}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      onPointerDown={() => {
        if (pickerFor) setPickerFor(null)
      }}
    >
      <AnimatePresence initial={false}>
        {messages.map(m => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={m.mine ? 'text-right' : 'text-left'}
            onPointerDown={event => event.stopPropagation()}
          >
            <div className={`relative inline-flex max-w-[80%] ${m.mine ? 'justify-end' : 'justify-start'}`}>
              <span
                className={`relative inline-block rounded-2xl px-3 py-2 text-sm ${m.reaction ? 'pb-5 pr-6' : ''} ${
                  m.mine ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800'
                }`}
                onContextMenu={event => {
                  event.preventDefault()
                  event.stopPropagation()
                  setPickerFor(m.id)
                }}
                onTouchStart={event => {
                  event.stopPropagation()
                  clearLongPress()
                  longPressTimer.current = window.setTimeout(() => {
                    setPickerFor(m.id)
                  }, 400)
                }}
                onTouchEnd={event => {
                  event.stopPropagation()
                  clearLongPress()
                }}
                onTouchMove={() => {
                  clearLongPress()
                }}
                onTouchCancel={() => {
                  clearLongPress()
                }}
              >
                {m.text}
                {pickerFor === m.id && (
                  <div
                    className={`absolute -top-12 z-10 flex gap-1 rounded-full border border-zinc-200 bg-white/95 px-2 py-1 text-lg shadow-md backdrop-blur dark:border-zinc-700 dark:bg-zinc-800/95 ${
                      m.mine ? 'right-0' : 'left-0'
                    }`}
                    onPointerDown={event => event.stopPropagation()}
                  >
                    {reactionOptions.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        className={`h-7 w-7 rounded-full transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 ${
                          m.reaction === emoji ? 'bg-zinc-100 dark:bg-zinc-700' : ''
                        }`}
                        onClick={event => {
                          event.stopPropagation()
                          setMessageReaction(m.id, m.reaction === emoji ? null : emoji)
                          setPickerFor(null)
                        }}
                        aria-label={`React with ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                {m.reaction && (
                  <span
                    className={`absolute -bottom-2 text-xs drop-shadow-sm ${m.mine ? 'right-2' : 'left-2'}`}
                  >
                    {m.reaction}
                  </span>
                )}
              </span>
            </div>
            <div className="mt-0.5 text-[11px] text-zinc-500">{new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
