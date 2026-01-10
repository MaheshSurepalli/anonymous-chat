import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ClientToServer, ServerToClient } from '../types/events'
import { getWsUrl } from '../utils/getWsUrl'

export type Status = 'idle' | 'searching' | 'matched'

export type Msg = { id: string; text: string; mine: boolean; ts: number; reaction: string | null }

export type Partner = { id: string; avatar: string } | null

type ChatContextValue = {
  status: Status
  socketOpen: boolean
  userId: string
  avatar: string
  room: string | null
  partner: Partner
  startedAt: number | null
  messages: Msg[]
  typing: boolean
  queueSize: number | null
  connectAndFind: () => void
  sendMessage: (text: string) => void
  sendTyping: (isTyping: boolean) => void
  next: () => void
  leave: () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

const randomEmoji = () => {
  const bank = ['😎', '🤖', '🦊', '🐼', '🐸', '🦄', '🐯', '🐙', '🐶', '🐱', '🐵', '🐧', '🐢', '🐳', '🐝']
  return bank[Math.floor(Math.random() * bank.length)]
}

const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null)
  const typingClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [status, setStatus] = useState<Status>('idle')
  const [socketOpen, setSocketOpen] = useState(false)
  const [userId] = useState<string>(genId())
  const [avatar] = useState<string>(randomEmoji())
  const [room, setRoom] = useState<string | null>(null)
  const [partner, setPartner] = useState<Partner>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [typing, setTyping] = useState(false)
  const [queueSize, setQueueSize] = useState<number | null>(null)

  const handleClose = useCallback(() => {
    setSocketOpen(false)
    wsRef.current = null
    if (status === 'searching') {
      setTimeout(() => connectAndFind(), 1000)
    }
  }, [status])

  const handleMessage = useCallback((ev: any) => {
    try {
      const data = JSON.parse((ev as any).data) as ServerToClient
      if (data.type === 'paired') {
        setStatus('matched')
        setRoom(data.room)
        setPartner(data.partner)
        setStartedAt(data.startedAt)
        setMessages([])
        setTyping(false)
      } else if (data.type === 'message') {
        setMessages((prev) => {
          const isSelfEcho = prev.some((m) => m.ts === data.sentAt && m.mine)
          if (isSelfEcho) return prev
          return [...prev, { id: genId(), text: data.text, mine: false, ts: data.sentAt, reaction: null }]
        })
      } else if (data.type === 'typing') {
        setTyping(!!data.isTyping)
        if (typingClearTimer.current) clearTimeout(typingClearTimer.current)
        if (data.isTyping) {
          typingClearTimer.current = setTimeout(() => setTyping(false), 2000)
        }
      } else if (data.type === 'system') {
        if (data.code === 'searching') {
          setStatus('searching')
          setPartner(null)
          setRoom(null)
          setMessages([])
          setTyping(false)
          setStartedAt(null)
        } else if (data.code === 'idle') {
          setStatus('idle')
          setPartner(null)
          setRoom(null)
          setMessages([])
          setTyping(false)
          setStartedAt(null)
        }
      } else if (data.type === 'queue_size') {
        setQueueSize(data.count)
      }
    } catch (e) {
      // noop
    }
  }, [])

  const connectAndFind = useCallback(() => {
    const existing = wsRef.current
    if (existing && existing.readyState === WebSocket.OPEN) {
      const evt: ClientToServer = { type: 'join_queue', userId, avatar }
      existing.send(JSON.stringify(evt))
      setStatus('searching')
      setPartner(null)
      setRoom(null)
      setMessages([])
      setTyping(false)
      return
    }

    const url = getWsUrl()
    const ws = new WebSocket(url)
    wsRef.current = ws
    ws.onopen = () => {
      setSocketOpen(true)
      setStatus('searching')
      setPartner(null)
      setRoom(null)
      setMessages([])
      setTyping(false)
      const evt: ClientToServer = { type: 'join_queue', userId, avatar }
      ws.send(JSON.stringify(evt))
    }
    ws.onmessage = handleMessage
    ws.onclose = handleClose
    ws.onerror = () => {
      // Let close handler handle backoff
    }
  }, [avatar, handleClose, handleMessage, userId])

  const sendMessage = useCallback((text: string) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN || !room) return
    const sentAt = Date.now()
    const evt: ClientToServer = { type: 'message', room, text, sentAt }
    ws.send(JSON.stringify(evt))
    setMessages((prev) => [...prev, { id: genId(), text, mine: true, ts: sentAt, reaction: null }])
  }, [room])

  const sendTyping = useCallback((isTyping: boolean) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN || !room) return
    const evt: ClientToServer = { type: 'typing', room, isTyping }
    ws.send(JSON.stringify(evt))
  }, [room])

  const next = useCallback(() => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    setStatus('searching')
    setPartner(null)
    setRoom(null)
    setMessages([])
    setTyping(false)
    setStartedAt(null)
    ws.send(JSON.stringify({ type: 'next' } satisfies ClientToServer))
  }, [])

  const leave = useCallback(() => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'leave' } satisfies ClientToServer))
    }
    setStatus('idle')
    setPartner(null)
    setRoom(null)
    setMessages([])
    setTyping(false)
    setStartedAt(null)
  }, [])

  const value = useMemo<ChatContextValue>(() => ({
    status,
    socketOpen,
    userId,
    avatar,
    room,
    partner,
    startedAt,
    messages,
    typing,
    queueSize,
    connectAndFind,
    sendMessage,
    sendTyping,
    next,
    leave,
  }), [avatar, messages, next, leave, partner, queueSize, room, sendMessage, sendTyping, socketOpen, startedAt, status, typing, userId, connectAndFind])

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}
