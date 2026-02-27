import React, { useMemo, useState, useRef, useEffect } from 'react'
import { Platform, Pressable, StyleSheet, TextInput, View, AppState } from 'react-native'
import { BlurView } from 'expo-blur'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useChat } from '../state/ChatContext'
import { debounce } from '../utils/debounce'
import { useTheme } from '../state/ThemeContext'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export default function MessageInput() {
  const { sendMessage, sendTyping } = useChat()
  const [text, setText] = useState('')
  const { colors, resolvedMode } = useTheme()
  const inputRef = useRef<TextInput>(null)
  const appState = useRef(AppState.currentState)
  const insets = useSafeAreaInsets()

  // 0 = empty/disabled  →  1 = has text/active
  const progress = useSharedValue(0)

  const debouncedTyping = useMemo(
    () => debounce((isTyping: boolean) => sendTyping(isTyping), 180),
    [sendTyping]
  )

  const isSendDisabled = text.trim().length === 0

  // Drive the animation whenever text changes
  useEffect(() => {
    const hasText = text.trim().length > 0
    if (hasText) {
      progress.value = withSpring(1, { damping: 12, stiffness: 200, mass: 0.7 })
    } else {
      progress.value = withTiming(0, { duration: 180 })
    }
  }, [text, progress])

  // Fix for Android keyboard state losing sync on app resume
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

    return () => subscription.remove()
  }, [])

  const submit = () => {
    const t = text.trim()
    if (!t) return
    sendMessage(t)
    setText('')
    sendTyping(false)
  }

  // Colour stops for interpolation
  const disabledBg = resolvedMode === 'dark' ? '#2d2d2d' : '#e5e7eb'
  const activeBg = colors.primaryBg

  const animatedBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 0.15 }],
    backgroundColor: interpolateColor(progress.value, [0, 1], [disabledBg, activeBg]),
  }))

  const animatedIconStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + progress.value * 0.6,
  }))

  // Icon colour resolves from the theme so it always contrasts
  const iconColor = isSendDisabled
    ? (resolvedMode === 'dark' ? '#6b7280' : '#9ca3af')
    : colors.primaryText

  return (
    <BlurView
      intensity={80}
      tint={resolvedMode === 'dark' ? 'dark' : 'light'}
      style={[
        styles.wrapper,
        { paddingBottom: insets.bottom + 12 },
        { borderTopColor: resolvedMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
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
          placeholderTextColor={
            resolvedMode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'
          }
          style={[
            styles.input,
            {
              borderColor: resolvedMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              backgroundColor: resolvedMode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)',
              color: colors.text,
            },
          ]}
        />

        <AnimatedPressable
          onPress={submit}
          disabled={isSendDisabled}
          style={[styles.sendBtn, animatedBtnStyle]}
        >
          <Animated.View style={animatedIconStyle}>
            <Ionicons name="arrow-up" size={22} color={iconColor} />
          </Animated.View>
        </AnimatedPressable>
      </View>
    </BlurView>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 12,
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
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
    lineHeight: 20,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
})
