import { useRef } from 'react'
import type { MouseEventHandler, PointerEventHandler, TouchEventHandler } from 'react'
import type { Msg, Reaction } from '../state/useChatStore'

const REACTIONS: Reaction[] = ['👍', '😂', '❤️', '😮']

type Props = {
  message: Msg
  isActive: boolean
  onOpen: () => void
  onSelect: (reaction: Reaction | null) => void
}

export default function MessageBubble({ message, isActive, onOpen, onSelect }: Props) {
  const longPressTimer = useRef<number | null>(null)

  const clearTimer = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleTouchStart: TouchEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation()
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current)
    longPressTimer.current = window.setTimeout(() => {
      onOpen()
      longPressTimer.current = null
    }, 350)
  }

  const handleTouchEnd: TouchEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation()
    clearTimer()
  }

  const handleContextMenu: MouseEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
    event.stopPropagation()
    onOpen()
  }

  const handlePointerLeave: PointerEventHandler<HTMLDivElement> = () => {
    clearTimer()
  }

  const handleBubbleClick: MouseEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation()
  }

  const selectReaction = (reaction: Reaction) => {
    const next = message.reaction === reaction ? null : reaction
    onSelect(next)
  }

  return (
    <div
      className={`relative inline-block max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
        message.mine
          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
          : 'bg-zinc-100 dark:bg-zinc-800'
      }`}
      onContextMenu={handleContextMenu}
      onClick={handleBubbleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      onPointerLeave={handlePointerLeave}
    >
      {message.text}
      {message.reaction && (
        <div className="absolute -bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs shadow-sm ring-1 ring-black/5 dark:bg-zinc-900 dark:text-white">
          {message.reaction}
        </div>
      )}
      {isActive && (
        <div
          className="absolute bottom-full right-0 z-10 mb-2 flex items-center space-x-1 rounded-full border border-zinc-200 bg-white px-2 py-1 text-lg shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          onClick={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
        >
          {REACTIONS.map(reaction => (
            <button
              key={reaction}
              type="button"
              onClick={() => selectReaction(reaction)}
              className="transition-transform hover:scale-110"
            >
              {reaction}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
