import React, { useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useChat } from '../state/ChatContext'
import { useTheme } from '../state/ThemeContext'

const QUOTES = [
  'Maybe they’re cool. Maybe they’re chaos.',
  'Someone new. Zero context. Infinite vibe.',
  'Say hi. Worst case? A story.',
  'No socials. No receipts. Just talk.',
  'Vibe check: pending.',
  'Two bubbles. One spark.',
  'Anonymous. Curious. Kinda exciting.',
  'New chat, new energy.'
]

export default function IdleScreen() {
  const { connectAndFind, queueSize } = useChat()
  const [i, setI] = useState(0)
  const { colors } = useTheme()


  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        <Text style={[styles.quote, { color: colors.text }]} key={i}>{QUOTES[i]}</Text>
        {typeof queueSize === 'number' && queueSize > 2 && (
          <Text style={[styles.queue, { color: colors.muted }]}>{queueSize} waiting</Text>
        )}
        <Pressable accessibilityRole="button" onPress={() => { console.log('[SC] Find button pressed'); connectAndFind() }} style={({ pressed }) => [styles.btn, { backgroundColor: colors.primaryBg }, pressed && { opacity: 0.9 }]}>
          <Text style={[styles.btnText, { color: colors.primaryText }]}>Find Stranger</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  content: { maxWidth: 480, width: '100%', alignItems: 'center', gap: 16 },
  quote: { fontSize: 18, textAlign: 'center' },
  queue: { fontSize: 12 },
  btn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  btnText: { fontWeight: '600' },
})

