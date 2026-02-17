import React, { useMemo } from 'react'
import { FlatList, ListRenderItem, Pressable, StyleSheet, Text, View } from 'react-native'
import type { Msg } from '../state/ChatContext'
import { useChat } from '../state/ChatContext'
import { useTheme } from '../state/ThemeContext'

export default function MessageList() {
  const { messages, typing, partner, sendMessage } = useChat()
  const { colors } = useTheme()

  // Reverse messages for inverted list (Index 0 = Newest = Bottom)
  const reversedMessages = useMemo(() => [...messages].reverse(), [messages])

  const renderItem: ListRenderItem<Msg> = ({ item }) => {
    const isMine = item.mine
    return (
      <View style={[styles.row, isMine ? styles.rowMine : styles.rowOther]}>
        {!isMine && !!partner && <Text style={styles.avatar}>{partner.avatar}</Text>}
        <View style={[styles.bubble, { backgroundColor: isMine ? colors.bubbleMine : colors.bubbleOther }, isMine ? { borderTopRightRadius: 4 } : { borderTopLeftRadius: 4 }]}>
          <Text style={[isMine ? { color: colors.bubbleTextMine } : { color: colors.bubbleTextOther }]}>{item.text}</Text>
          {!!item.reaction && <Text style={styles.reaction}>{item.reaction}</Text>}
        </View>
      </View>
    )
  }

  const TypingIndicator = () => (
    <View style={[styles.row, styles.rowOther]}>
      {!!partner && <Text style={styles.avatar}>{partner.avatar}</Text>}
      <View style={[styles.bubble, { backgroundColor: colors.bubbleOther, borderTopLeftRadius: 4 }]}>
        <Text style={{ color: colors.bubbleTextOther }}>typing…</Text>
      </View>
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <FlatList
        inverted
        data={reversedMessages}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.content, reversedMessages.length === 0 && styles.emptyContent]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.muted }]}>Break the ice 🧊</Text>
            <View style={styles.chipContainer}>
              {[
                'What’s your most embarrassing moment? 😳',
                'Truth or Dare? 🎲',
                'Rate your day 1–10 📉',
              ].map((text) => (
                <Pressable
                  key={text}
                  style={({ pressed }) => [
                    styles.chip,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                  ]}
                  onPress={() => sendMessage(text)}
                >
                  <Text style={[styles.chipText, { color: colors.text }]}>{text}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        ListHeaderComponent={typing ? <TypingIndicator /> : null}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 12, paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 4, gap: 8 },
  rowMine: { justifyContent: 'flex-end' },
  rowOther: { justifyContent: 'flex-start' },
  avatar: { fontSize: 20, marginBottom: 2 },
  bubble: { maxWidth: '80%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  reaction: { marginTop: 4 },
  emptyContent: { flex: 1, justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', gap: 24, paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '500' },
  chipContainer: { width: '100%', gap: 12 },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  chipText: { fontSize: 14, fontWeight: '500' },
})
