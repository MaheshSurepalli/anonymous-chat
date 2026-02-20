import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Device from 'expo-device'
import type { ClientToServer, ServerToClient } from '../types/events'
import { getWsUrl } from '../utils/getWsUrl'
import { usePushNotifications } from '../hooks/usePushNotifications'

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

const USER_ID_KEY = '@stranger_chat_user_id'

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null)
  const typingClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [status, setStatus] = useState<Status>('idle')
  const [socketOpen, setSocketOpen] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const [ready, setReady] = useState(false)
  const [avatar] = useState<string>(randomEmoji())
  const [room, setRoom] = useState<string | null>(null)
  const [partner, setPartner] = useState<Partner>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [typing, setTyping] = useState(false)

  const [queueSize, setQueueSize] = useState<number | null>(null)

  // Load or create persistent user_id
  useEffect(() => {
    (async () => {
      let id = await AsyncStorage.getItem(USER_ID_KEY)
      if (!id) {
        id = genId()
        await AsyncStorage.setItem(USER_ID_KEY, id)
        console.log('[WS] Generated new persistent user_id:', id)
      } else {
        console.log('[WS] Loaded persistent user_id:', id)
      }
      setUserId(id)
      setReady(true)
    })()
  }, [])

  const { expoPushToken } = usePushNotifications()

  useEffect(() => {
    if (socketOpen && expoPushToken && userId) {
      const ws = wsRef.current
      if (ws && ws.readyState === WebSocket.OPEN) {
        const deviceName = `${Device.manufacturer ?? ''} ${Device.modelName ?? ''}`.trim() || 'Unknown'
        console.log('[WS] Registering push token:', expoPushToken, 'device:', deviceName)
        ws.send(JSON.stringify({ type: 'register_push', token: expoPushToken, userId, deviceName }))
      }
    }
  }, [socketOpen, expoPushToken, userId])

  const handleClose = useCallback((ev?: any) => {
    console.log('[WS] Connection closed', ev?.code, ev?.reason)
    setSocketOpen(false)
    wsRef.current = null
    if (status === 'searching') {
      console.log('[WS] Was searching, will reconnect in 1s...')
      setTimeout(() => connectAndFind(), 1000)
    }
  }, [status])

  const handleMessage = useCallback((ev: any) => {
    try {
      const data = JSON.parse((ev as any).data) as ServerToClient
      console.log('[WS] Received:', data.type)
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
          // Partner left — close connection, go fully idle
          const ws = wsRef.current
          if (ws) ws.close()
          wsRef.current = null
          setSocketOpen(false)
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
      console.error('[WS] Failed to parse message:', e)
    }
  }, [])

  const connectAndFind = useCallback(() => {
    if (!ready) {
      console.warn('[WS] user_id not loaded yet, ignoring connectAndFind')
      return
    }
    const existing = wsRef.current
    if (existing && existing.readyState === WebSocket.OPEN) {
      console.log('[WS] Reusing existing connection, sending join_queue')
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
    console.log('[WS] Opening new connection to:', url)
    const ws = new WebSocket(url)
    wsRef.current = ws
    ws.onopen = () => {
      console.log('[WS] ✅ Connected successfully!')
      setSocketOpen(true)
      setStatus('searching')
      setPartner(null)
      setRoom(null)
      setMessages([])
      setTyping(false)
      const evt: ClientToServer = { type: 'join_queue', userId, avatar }
      ws.send(JSON.stringify(evt))
      console.log('[WS] Sent join_queue for user:', userId)
    }
    ws.onmessage = handleMessage
    ws.onclose = handleClose
    ws.onerror = (err) => {
      console.error('[WS] ❌ Connection error:', JSON.stringify(err))
    }
  }, [ready, avatar, handleClose, handleMessage, userId])

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
      ws.close()
    }
    wsRef.current = null
    setSocketOpen(false)
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
