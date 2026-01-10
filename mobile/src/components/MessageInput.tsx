import React, { useMemo, useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useChat } from '../state/ChatContext'
import { debounce } from '../utils/debounce'
import { useTheme } from '../state/ThemeContext'

export default function MessageInput() {
  const { sendMessage, sendTyping } = useChat()
  const [text, setText] = useState('')
  const { colors } = useTheme()

  const debouncedTyping = useMemo(() => debounce((isTyping: boolean) => sendTyping(isTyping), 180), [sendTyping])

  const isSendDisabled = text.trim().length === 0

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
