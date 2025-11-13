import React, { useEffect, useRef } from 'react'
import { FlatList, ListRenderItem, StyleSheet, Text, View } from 'react-native'
import type { Msg } from '../state/ChatContext'
import { useChat } from '../state/ChatContext'
import { useTheme } from '../state/ThemeContext'

export default function MessageList() {
  const { messages, typing, partner } = useChat()
  const listRef = useRef<FlatList<Msg>>(null)
  const { colors } = useTheme()

  useEffect(() => {
    // Scroll to end on new content
    const id = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 0)
    return () => clearTimeout(id)
  }, [messages.length, typing])

  const renderItem: ListRenderItem<Msg> = ({ item }) => {
    const isMine = item.mine
    return (
      <View style={[styles.row, isMine ? styles.rowMine : styles.rowOther]}>
        {!isMine && !!partner && <Text style={styles.avatar}>{partner.avatar}</Text>}
        <View style={[styles.bubble, { backgroundColor: isMine ? colors.bubbleMine : colors.bubbleOther }, isMine ? { borderTopRightRadius: 4 } : { borderTopLeftRadius: 4 } ]}>
          <Text style={[isMine ? { color: colors.bubbleTextMine } : { color: colors.bubbleTextOther }]}>{item.text}</Text>
          {!!item.reaction && <Text style={styles.reaction}>{item.reaction}</Text>}
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
      />
      {typing && (
        <View style={[styles.row, styles.rowOther]}>
          {!!partner && <Text style={styles.avatar}>{partner.avatar}</Text>}
          <View style={[styles.bubble, { backgroundColor: colors.bubbleOther, borderTopLeftRadius: 4 }]}>
            <Text style={{ color: colors.bubbleTextOther }}>typing…</Text>
          </View>
        </View>
      )}
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
})
