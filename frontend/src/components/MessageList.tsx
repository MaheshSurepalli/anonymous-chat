import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import MessageBubble from './MessageBubble'
import { useChatStore } from '../state/useChatStore'
import useKeyboardOffset from '../hooks/useKeyboardOffset'

export default function MessageList() {
  const { messages, setMessageReaction } = useChatStore()
  const ref = useRef<HTMLDivElement>(null)
  const keyboardOffset = useKeyboardOffset()
  useEffect(() => { ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' }) }, [messages])
  const bottomPadding = `calc(env(safe-area-inset-bottom) + 0.75rem + ${keyboardOffset}px)`
  const scrollPaddingBottom = `calc(env(safe-area-inset-bottom) + 7rem + ${keyboardOffset}px)`
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const closePicker = () => setActiveId(null)
    window.addEventListener('click', closePicker)
    window.addEventListener('touchstart', closePicker)
    return () => {
      window.removeEventListener('click', closePicker)
      window.removeEventListener('touchstart', closePicker)
    }
  }, [])

  const openPicker = useCallback((id: string) => {
    setActiveId(id)
  }, [])

  const handleSelectReaction = useCallback(
    (id: string, reaction: Parameters<typeof setMessageReaction>[1]) => {
      setMessageReaction(id, reaction)
      setActiveId(null)
    },
    [setMessageReaction]
  )

  return (
    <div
      ref={ref}
      className="flex-1 overflow-y-auto px-4 py-3 space-y-2"
      style={{ paddingBottom: bottomPadding, scrollPaddingBottom }}
    >
      <AnimatePresence initial={false}>
        {messages.map(m => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={m.mine ? 'text-right' : 'text-left'}>
            <MessageBubble
              message={m}
              isActive={activeId === m.id}
              onOpen={() => openPicker(m.id)}
              onSelect={(reaction) => handleSelectReaction(m.id, reaction)}
            />
            <div className="mt-3 text-[11px] text-zinc-500">{new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
