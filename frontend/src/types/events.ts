export type ClientToServer =
  | { type: 'join_queue'; userId: string; avatar: string }
  | { type: 'message'; room: string; text: string; sentAt: number }
  | { type: 'typing'; room: string; isTyping: boolean }
  | { type: 'next' }
  | { type: 'leave' };

export type ServerToClient =
  | { type: 'paired'; room: string; partner: { id: string; avatar: string }; startedAt: number }
  | { type: 'message'; room: string; text: string; sentAt: number }
  | { type: 'typing'; room: string; isTyping: boolean }
  | { type: 'system'; code: 'idle' | 'searching'; message: string }
  | { type: 'queue_size'; count: number }
  | { type: 'error'; message: string };