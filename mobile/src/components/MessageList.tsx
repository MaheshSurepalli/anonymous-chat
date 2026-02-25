import React, { useMemo, useEffect } from 'react'
import { FlatList, ListRenderItem, Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import type { Msg } from '../state/ChatContext'
import { useChat } from '../state/ChatContext'
import { useTheme } from '../state/ThemeContext'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type MsgProps = {
  item: Msg
  partner: any
  colors: any
  resolvedMode: 'light' | 'dark'
}

const AnimatedMessageItem = ({ item, partner, colors, resolvedMode }: MsgProps) => {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(30)

  useEffect(() => {
    // Entrance animation: Slide up + Fade in
    opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) })
    translateY.value = withSpring(0, { damping: 15, stiffness: 200 })
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }))

  const isMine = item.mine
  const showAvatar = !isMine && !!partner

  return (
    <Animated.View style={[styles.row, isMine ? styles.rowMine : styles.rowOther, animatedStyle]}>
      {showAvatar && <Text style={styles.avatar}>{partner.avatar}</Text>}
      {isMine ? (
        <LinearGradient
          colors={resolvedMode === 'dark' ? ['#ec4899', '#8b5cf6'] : ['#ff758c', '#ff7eb3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, styles.bubbleMine]}
        >
          <Text style={{ color: '#ffffff', fontSize: 16, lineHeight: 22 }}>{item.text}</Text>
          {!!item.reaction && <Text style={styles.reaction}>{item.reaction}</Text>}
        </LinearGradient>
      ) : (
        <View style={[styles.bubble, styles.bubbleOther, { backgroundColor: resolvedMode === 'dark' ? '#2A2A2A' : '#F0F0F0' }]}>
          <Text style={{ color: resolvedMode === 'dark' ? '#ffffff' : '#111827', fontSize: 16, lineHeight: 22 }}>{item.text}</Text>
          {!!item.reaction && <Text style={styles.reaction}>{item.reaction}</Text>}
        </View>
      )}
    </Animated.View>
  )
}

const TypingDots = () => {
  const { colors, resolvedMode } = useTheme()
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(20)

  const d1 = useSharedValue(0)
  const d2 = useSharedValue(0)
  const d3 = useSharedValue(0)

  useEffect(() => {
    // Initial entrance for typing bubble
    opacity.value = withTiming(1, { duration: 300 })
    translateY.value = withSpring(0, { damping: 15, stiffness: 200 })

    const sequence = (dot: any, delay: number) => {
      dot.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(-5, { duration: 300, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          false
        )
      )
    }

    sequence(d1, 0)
    sequence(d2, 150)
    sequence(d3, 300)
  }, [])

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }))

  const s1 = useAnimatedStyle(() => ({ transform: [{ translateY: d1.value }] }))
  const s2 = useAnimatedStyle(() => ({ transform: [{ translateY: d2.value }] }))
  const s3 = useAnimatedStyle(() => ({ transform: [{ translateY: d3.value }] }))

  return (
    <Animated.View style={[styles.row, styles.rowOther, containerStyle]}>
      {/* For spacing consistency we could render avatar if needed, left blank for anonymous vibe if no partner */}
      <View style={[styles.bubble, styles.bubbleOther, { backgroundColor: resolvedMode === 'dark' ? '#2A2A2A' : '#F0F0F0', flexDirection: 'row', gap: 4, height: 42, alignItems: 'center', paddingHorizontal: 16, paddingVertical: 0 }]}>
        <Animated.View style={[s1, { width: 6, height: 6, borderRadius: 3, backgroundColor: resolvedMode === 'dark' ? '#ffffff' : colors.muted }]} />
        <Animated.View style={[s2, { width: 6, height: 6, borderRadius: 3, backgroundColor: resolvedMode === 'dark' ? '#ffffff' : colors.muted }]} />
        <Animated.View style={[s3, { width: 6, height: 6, borderRadius: 3, backgroundColor: resolvedMode === 'dark' ? '#ffffff' : colors.muted }]} />
      </View>
    </Animated.View>
  )
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const AnimatedIcebreaker = ({
  text,
  onPress,
  resolvedMode
}: {
  text: string;
  onPress: () => void;
  resolvedMode: 'light' | 'dark'
}) => {
  const { colors } = useTheme()
  const scale = useSharedValue(1)
  const isPressed = useSharedValue(0)

  const handlePressIn = () => {
    isPressed.value = 1
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 })
  }

  const handlePressOut = () => {
    isPressed.value = 0
    scale.value = withSpring(1, { damping: 12, stiffness: 250 })
  }

  const animatedStyle = useAnimatedStyle(() => {
    // Glassmorphism dynamic border
    const borderColor = resolvedMode === 'dark'
      ? `rgba(255, 255, 255, 0.1)`
      : `rgba(0, 0, 0, 0.1)`

    // Slight background shift on press
    const baseBgMatch = resolvedMode === 'dark' ? '#1f2937' : '#ffffff'
    const pressedBgMatch = resolvedMode === 'dark' ? '#374151' : '#f3f4f6'

    return {
      transform: [{ scale: scale.value }],
      borderColor,
      backgroundColor: isPressed.value ? pressedBgMatch : baseBgMatch,
    }
  })

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={[styles.chip, animatedStyle]}
    >
      <Text style={[styles.chipText, { color: colors.text }]}>{text}</Text>
    </AnimatedPressable>
  )
}

export default function MessageList() {
  const { messages, typing, partner, sendMessage } = useChat()
  const { colors, resolvedMode } = useTheme()
  const insets = useSafeAreaInsets()

  // Reverse messages for inverted list (Index 0 = Newest = Bottom)
  const reversedMessages = useMemo(() => [...messages].reverse(), [messages])

  const renderItem: ListRenderItem<Msg> = ({ item, index }) => {
    return (
      <AnimatedMessageItem
        item={item}
        partner={partner}
        colors={colors}
        resolvedMode={resolvedMode!}
      />
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <FlatList
        inverted
        data={reversedMessages}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.content,
          { paddingTop: 80, paddingBottom: insets.top + 60 }, // Spacer for the absolute positioned MessageInput
          reversedMessages.length === 0 && styles.emptyContent
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: colors.muted }]}>Break the ice 🧊</Text>
            <View style={styles.chipContainer}>
              {[
                'What’s your most embarrassing moment? 😳',
                'Truth or Dare? 🎲',
                'Rate your day 1–10 📉',
              ].map((text) => (
                <AnimatedIcebreaker key={text} text={text} resolvedMode={resolvedMode} onPress={() => sendMessage(text)} />
              ))}
            </View>
          </View>
        }
        ListHeaderComponent={typing ? <TypingDots /> : null}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 12, paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 6, gap: 8 },
  rowMine: { justifyContent: 'flex-end' },
  rowOther: { justifyContent: 'flex-start' },
  avatar: { fontSize: 20, marginBottom: 2 },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  // High border radius, asymmetrical
  bubbleMine: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 4, // Sharp corner
  },
  bubbleOther: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 4, // Sharp corner
    borderBottomRightRadius: 20,
  },
  reaction: { marginTop: 4 },
  emptyContent: { flex: 1, justifyContent: 'center' },
  emptyContainer: { alignItems: 'center', gap: 24, paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '500' },
  chipContainer: { width: '100%', gap: 12 },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24, // Pill shape
    borderWidth: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  chipText: { fontSize: 14, fontWeight: '600' },
})
