import React, { useMemo, useState, useRef, useEffect } from 'react'
import { Platform, Pressable, StyleSheet, Text, TextInput, View, AppState, Keyboard } from 'react-native'
import { useChat } from '../state/ChatContext'
import { debounce } from '../utils/debounce'
import { useTheme } from '../state/ThemeContext'

export default function MessageInput() {
  const { sendMessage, sendTyping } = useChat()
  const [text, setText] = useState('')
  const { colors } = useTheme()
  const inputRef = useRef<TextInput>(null)
  const appState = useRef(AppState.currentState)

  const debouncedTyping = useMemo(() => debounce((isTyping: boolean) => sendTyping(isTyping), 180), [sendTyping])

  const isSendDisabled = text.trim().length === 0

  // Fix for Android Keyboard state losing sync on app resume
  useEffect(() => {
    if (Platform.OS !== 'android') return

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        // If the input was focused, or if the keyboard thinks it's up, we might need to nudge it.
        // We force a blur/focus cycle to "wake up" the window soft input mode.
        if (inputRef.current?.isFocused()) {
          // Small delay to ensure the window is ready to accept layout changes
          setTimeout(() => {
            inputRef.current?.blur()
            inputRef.current?.focus()
          }, 100)
        }
      }

      appState.current = nextAppState
    })

    return () => {
      subscription.remove()
    }
  }, [])

  const submit = () => {
    const t = text.trim()
    if (!t) return
    sendMessage(t)
    setText('')
    sendTyping(false)
  }

  return (
    <View style={[styles.wrapper, { borderTopColor: colors.border, backgroundColor: colors.bg }]}>
      <View style={styles.row}>
        <TextInput
          ref={inputRef}
          placeholder="Say something…"
          value={text}
          onChangeText={(t) => { setText(t); debouncedTyping(t.length > 0) }}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          onSubmitEditing={Platform.OS === 'ios' ? submit : undefined}
          placeholderTextColor={colors.muted}
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
        />
        <Pressable
          onPress={submit}
          disabled={isSendDisabled}
          style={[
            styles.sendBtn,
            isSendDisabled ? { backgroundColor: '#e5e7eb' } : { backgroundColor: colors.primaryBg }
          ]}
        >
          <Text style={[styles.sendText, isSendDisabled ? { color: '#6b7280' } : { color: colors.primaryText }]}>Send</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { padding: 8, borderTopWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 160,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  sendBtn: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  sendText: { fontWeight: '600' },
})
