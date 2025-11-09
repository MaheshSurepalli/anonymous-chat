import { create } from 'zustand'
import type { ClientToServer, ServerToClient } from '../types/events'

export type Status = 'idle' | 'searching' | 'matched'

type Msg = { id: string; text: string; mine: boolean; ts: number }

type Partner = { id: string; avatar: string } | null

let typingClearTimer: number | undefined

type Store = {
  status: Status
  socket: WebSocket | null
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
  setTheme: (t: 'light' | 'dark') => void
}

const randomEmoji = () => {
  const bank = ['🦊', '🐼', '🐸', '🐨', '🐯', '🐙', '🐧', '🐳', '🦄', '🐝', '🐶', '🐱', '🦁', '🐷']
  const pick = bank[Math.floor(Math.random() * bank.length)]
  return pick
}

const genId = () => crypto.randomUUID()

const WS_URL = import.meta.env.VITE_WS_URL

export const useChatStore = create<Store>((set, get) => ({
  status: 'idle',
  socket: null,
  userId: sessionStorage.getItem('sc_uid') || (() => { const id = genId(); sessionStorage.setItem('sc_uid', id); return id })(),
  avatar: sessionStorage.getItem('sc_avatar') || (() => { const a = randomEmoji(); sessionStorage.setItem('sc_avatar', a); return a })(),
  room: null,
  partner: null,
  startedAt: null,
  messages: [],
  typing: false,
  queueSize: null,

  connectAndFind: () => {
    const s = get()
    if (s.socket && s.socket.readyState === WebSocket.OPEN) {
      // Already open; just move to searching
      s.socket.send(JSON.stringify({ type: 'join_queue', userId: s.userId, avatar: s.avatar } satisfies ClientToServer))
      set({ status: 'searching', partner: null, room: null, messages: [], typing: false })
      return
    }

    console.log('Connecting to WS URL:', WS_URL)
    const ws = new WebSocket(WS_URL)
    ws.onopen = () => {
      set({ socket: ws, status: 'searching', partner: null, room: null, messages: [], typing: false })
      const evt: ClientToServer = { type: 'join_queue', userId: get().userId, avatar: get().avatar }
      ws.send(JSON.stringify(evt))
    }
    ws.onmessage = (ev) => {
      const data = JSON.parse(ev.data) as ServerToClient
      if (data.type === 'paired') {
        set({ status: 'matched', room: data.room, partner: data.partner, startedAt: data.startedAt, messages: [], typing: false })
      } else if (data.type === 'message') {
        // If we already appended this locally (same timestamp), skip the server echo
        const isSelfEcho = get().messages.some(m => m.ts === data.sentAt && m.mine);
        if (isSelfEcho) return;

        set(st => ({
          messages: [
            ...st.messages,
            { id: crypto.randomUUID(), text: data.text, mine: false, ts: data.sentAt }
          ]
        }));
      } else if (data.type === 'typing') {
        // show indicator
        set({ typing: !!data.isTyping })
        // auto-clear after 2s without new events
        if (typingClearTimer) clearTimeout(typingClearTimer)
        if (data.isTyping) {
          typingClearTimer = window.setTimeout(() => set({ typing: false }), 2000)
        }
      } else if (data.type === 'system') {
        if (data.code === 'searching') {
          set({ status: 'searching', partner: null, room: null, messages: [], typing: false, startedAt: null })
        } else if (data.code === 'idle') {
          set({ status: 'idle', partner: null, room: null, messages: [], typing: false, startedAt: null })
        }
      } else if (data.type === 'queue_size') {
        set({ queueSize: data.count })
      }
    }
    ws.onclose = () => {
      // If searching, try a simple backoff reconnect
      if (get().status === 'searching') {
        set({ socket: null })
        setTimeout(() => get().connectAndFind(), 1000)
      } else {
        set({ socket: null })
      }
    }
  },

  sendMessage: (text: string) => {
    const { socket, room, messages } = get()
    if (!socket || socket.readyState !== WebSocket.OPEN || !room) return
    const sentAt = Date.now()
    const evt: ClientToServer = { type: 'message', room, text, sentAt }
    socket.send(JSON.stringify(evt))
    set({ messages: [...messages, { id: crypto.randomUUID(), text, mine: true, ts: sentAt }] })
  },

  sendTyping: (isTyping: boolean) => {
    const { socket, room } = get()
    if (!socket || socket.readyState !== WebSocket.OPEN || !room) return
    const evt: ClientToServer = { type: 'typing', room, isTyping }
    socket.send(JSON.stringify(evt))
  },

  next: () => {
    const { socket } = get()
    if (!socket || socket.readyState !== WebSocket.OPEN) return
    // Optimistic searching per spec
    set({ status: 'searching', partner: null, room: null, messages: [], typing: false, startedAt: null })
    socket.send(JSON.stringify({ type: 'next' } satisfies ClientToServer))
  },

  leave: () => {
    const { socket } = get()
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'leave' } satisfies ClientToServer))
    }
    set({ status: 'idle', partner: null, room: null, messages: [], typing: false, startedAt: null })
  },

  setTheme: (t) => {
    document.documentElement.classList.toggle('dark', t === 'dark')
    document.documentElement.dataset.theme = t
    localStorage.setItem('theme-preference', t)
  }
}))