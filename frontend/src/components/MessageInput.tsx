import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useChatStore } from '../state/useChatStore'
import { debounce } from '../ws/client'
import useKeyboardOffset from '../hooks/useKeyboardOffset'

export default function MessageInput() {
  const { status, sendMessage, sendTyping, typing } = useChatStore()
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const stopTypingTimer = useRef<number | null>(null)
  const keyboardOffset = useKeyboardOffset()
  const isMatched = status === 'matched'

  const notifyTyping = useMemo(() => debounce((value: boolean) => sendTyping(value), 160), [sendTyping])

  useEffect(() => {
    if (!isMatched) return
    textareaRef.current?.focus()
  }, [isMatched])
  useEffect(
    () => () => {
      if (stopTypingTimer.current) {
        window.clearTimeout(stopTypingTimer.current)
        stopTypingTimer.current = null
      }
    },
    []
  )
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const maxHeight = 160 // roughly 5 lines
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
  }, [])

  useEffect(() => {
    if (!isMatched) return
    resizeTextarea()
  }, [isMatched, resizeTextarea, text])

  const scheduleTypingStop = () => {
    if (stopTypingTimer.current) window.clearTimeout(stopTypingTimer.current)
    stopTypingTimer.current = window.setTimeout(() => notifyTyping(false), 900)
  }

  const handleSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return

    sendMessage(trimmed)
    notifyTyping(false)
    if (stopTypingTimer.current) {
      window.clearTimeout(stopTypingTimer.current)
      stopTypingTimer.current = null
    }
    setText('')
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
      resizeTextarea()
    })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      formRef.current?.requestSubmit()
    }
  }

  const paddingBottom = 'calc(env(safe-area-inset-bottom) + 0.75rem)'
  const transform = keyboardOffset ? `translateY(-${keyboardOffset}px)` : undefined
  const isSendDisabled = !text.trim()

  if (!isMatched) return null

  return (
    <div
      className="sticky bottom-0 border-t border-zinc-200 bg-white/95 p-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95"
      style={{ paddingBottom, transform }}
    >
      <div className="mx-auto max-w-2xl space-y-2">
        {typing && (
          <div className="px-1 text-xs text-zinc-500" aria-live="polite">
            Stranger is typing…
          </div>
        )}
        <form
          ref={formRef}
          className="flex items-end gap-2"
          onSubmit={handleSubmit}
        >
          <label className="sr-only" htmlFor="chat-input">
            Message
          </label>
          <textarea
            ref={textareaRef}
            id="chat-input"
            rows={1}
            value={text}
            onChange={(event) => {
              const value = event.target.value
              setText(value)
              if (value.trim().length === 0) {
                notifyTyping(false)
                if (stopTypingTimer.current) {
                  window.clearTimeout(stopTypingTimer.current)
                  stopTypingTimer.current = null
                }
                return
              }
              notifyTyping(true)
              scheduleTypingStop()
            }}
            onBlur={() => {
              notifyTyping(false)
              if (stopTypingTimer.current) {
                window.clearTimeout(stopTypingTimer.current)
                stopTypingTimer.current = null
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            aria-label="Message"
            className="max-h-40 min-h-[2.5rem] flex-1 resize-none rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-zinc-200"
          />
          <button
            type="submit"
            disabled={isSendDisabled}
            onPointerDown={(event) => event.preventDefault()}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 disabled:cursor-not-allowed dark:focus-visible:ring-zinc-200 ${
              isSendDisabled
                ? 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200'
            }`}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
