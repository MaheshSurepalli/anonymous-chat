import React, { useMemo, useState, useRef, useEffect } from 'react'
import { Platform, Pressable, StyleSheet, Text, TextInput, View, AppState } from 'react-native'
import { BlurView } from 'expo-blur'
import { useChat } from '../state/ChatContext'
import { debounce } from '../utils/debounce'
import { useTheme } from '../state/ThemeContext'

export default function MessageInput() {
  const { sendMessage, sendTyping } = useChat()
  const [text, setText] = useState('')
  const { colors, resolvedMode } = useTheme()
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
        if (inputRef.current?.isFocused()) {
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
    <BlurView
      intensity={80}
      tint={resolvedMode === 'dark' ? 'dark' : 'light'}
      style={[
        styles.wrapper,
        { borderTopColor: resolvedMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
      ]}
    >
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
          placeholderTextColor={resolvedMode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'}
          style={[
            styles.input,
            {
              borderColor: resolvedMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              backgroundColor: resolvedMode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)',
              color: colors.text
            }
          ]}
        />
        <Pressable
          onPress={submit}
          disabled={isSendDisabled}
          style={({ pressed }) => [
            styles.sendBtn,
            isSendDisabled
              ? { backgroundColor: resolvedMode === 'dark' ? '#374151' : '#e5e7eb' }
              : { backgroundColor: colors.primaryBg },
            pressed && !isSendDisabled && { opacity: 0.8 },
            !isSendDisabled && styles.sendBtnActive
          ]}
        >
          <Text style={[
            styles.sendText,
            isSendDisabled
              ? { color: resolvedMode === 'dark' ? '#9ca3af' : '#6b7280' }
              : { color: colors.primaryText } // this resolves dynamically to contrast
          ]}>
            Send
          </Text>
        </Pressable>
      </View>
    </BlurView>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 160,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1,
    fontSize: 16,
    lineHeight: 20
  },
  sendBtn: {
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2 // Slightly offset to align dynamically with single-line input
  },
  sendBtnActive: {
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  sendText: {
    fontWeight: '700',
    fontSize: 16
  }
})
