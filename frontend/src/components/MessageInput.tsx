import { useEffect, useRef, useState } from 'react'
import { useChatStore } from '../state/useChatStore'
import { debounce } from '../ws/client'
import useKeyboardOffset from '../hooks/useKeyboardOffset'

export default function MessageInput() {
  const { status, sendMessage, sendTyping, typing } = useChatStore()
  const [text, setText] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  const keyboardOffset = useKeyboardOffset()

  const deb = useRef(debounce((v: boolean) => sendTyping(v), 200)).current

  useEffect(() => { ref.current?.focus() }, [status])
  if (status !== 'matched') return null

  const paddingBottom = `calc(env(safe-area-inset-bottom) + 0.75rem + ${keyboardOffset}px)`

  return (
    <div
      className="sticky border-t border-zinc-200 dark:border-zinc-800 p-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur"
      style={{ bottom: keyboardOffset ? `${keyboardOffset}px` : undefined, paddingBottom }}
    >
      <div className="border-t border-zinc-200 dark:border-zinc-800 p-3">
        {typing && <div className="px-1 pb-1 text-xs text-zinc-500">Stranger is typing…</div>}
        <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { sendMessage(text.trim()); setText('') } }}>
          <input
            ref={ref}
            value={text}
            onChange={(e) => { setText(e.target.value); deb(true); setTimeout(() => deb(false), 600) }}
            onBlur={() => sendTyping(false)}
            placeholder="Type a message"
            aria-label="Message"
            className="flex-1 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 outline-none focus:ring-2"
          />
          <button type="submit" className="px-3 py-2 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">Send</button>
        </form>
      </div>
    </div>
  )
}