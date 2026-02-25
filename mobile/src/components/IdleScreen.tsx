import React, { useEffect, useState } from 'react'
import { View, Text, Pressable, StyleSheet, Dimensions, Platform } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  interpolateColor,
} from 'react-native-reanimated'
import { BlurView } from 'expo-blur'
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

const { width, height } = Dimensions.get('window')
const BLOB_SIZE = width * 1.5

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const MeshBackground = React.memo(({ resolvedMode }: { resolvedMode: 'light' | 'dark' }) => {
  const blob1Rotation = useSharedValue(0)
  const blob2Rotation = useSharedValue(0)
  const blob3Rotation = useSharedValue(0)

  useEffect(() => {
    // Continuous rotation for mesh blobs
    blob1Rotation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    )
    blob2Rotation.value = withRepeat(
      withTiming(-360, { duration: 25000, easing: Easing.linear }),
      -1,
      false
    )
    blob3Rotation.value = withRepeat(
      withTiming(360, { duration: 18000, easing: Easing.linear }),
      -1,
      false
    )
  }, [])

  const blob1Style = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: width * 0.1 },
        { translateY: -height * 0.2 },
        { rotate: `${blob1Rotation.value}deg` },
        { translateX: -width * 0.1 },
        { scale: 1.2 }
      ],
      backgroundColor: withTiming(resolvedMode === 'dark' ? '#2d1b4e' : '#ffafbd', { duration: 1000 }),
    }
  })

  const blob2Style = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: -width * 0.3 },
        { translateY: height * 0.2 },
        { rotate: `${blob2Rotation.value}deg` },
        { translateX: width * 0.3 },
        { scale: 1.5 }
      ],
      backgroundColor: withTiming(resolvedMode === 'dark' ? '#111827' : '#a1c4fd', { duration: 1000 }),
    }
  })

  const blob3Style = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: width * 0.4 },
        { translateY: height * 0.4 },
        { rotate: `${blob3Rotation.value}deg` },
        { translateX: -width * 0.4 },
        { scale: 1.3 }
      ],
      backgroundColor: withTiming(resolvedMode === 'dark' ? '#0f0c29' : '#ffc3a0', { duration: 1000 }),
    }
  })

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Layer 1: the animated shapes */}
      <Animated.View style={[styles.blob, blob1Style]} />
      <Animated.View style={[styles.blob, blob2Style]} />
      <Animated.View style={[styles.blob, blob3Style]} />
      {/* Layer 2: A very heavy, intense blur over the top to melt the colors together */}
      <BlurView
        intensity={Platform.OS === 'ios' ? 100 : 150} // Heavy blur
        tint={resolvedMode === 'dark' ? 'dark' : 'light'}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Soft overlay to blend */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: resolvedMode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)' }]} />
    </View>
  )
})

export default function IdleScreen() {
  const { connectAndFind, queueSize } = useChat()
  const [i, setI] = useState(0)
  const { colors, resolvedMode } = useTheme()

  // Button pulse
  const pulse = useSharedValue(1)

  // Tagline animation
  const taglineY = useSharedValue(20)
  const taglineOpacity = useSharedValue(0)

  useEffect(() => {
    // Breathing pulse for button
    pulse.value = withRepeat(
      withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )

    // Slide up tagline on mount
    taglineOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) })
    taglineY.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) })
  }, [])

  const buttonStyle = useAnimatedStyle(() => {
    const shadowColorValue = resolvedMode === 'dark' ? '#8b5cf6' : '#ec4899'
    return {
      transform: [{ scale: pulse.value }],
      shadowColor: shadowColorValue,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.6,
      shadowRadius: 15 * pulse.value,
      elevation: 10 * pulse.value,
      opacity: pulse.value * 0.8 + 0.2 // subtle opacity pulse
    }
  })

  const taglineStyle = useAnimatedStyle(() => {
    return {
      opacity: taglineOpacity.value,
      transform: [{ translateY: taglineY.value }]
    }
  })

  return (
    <View style={[styles.container, { backgroundColor: resolvedMode === 'dark' ? '#000000' : '#ffffff' }]}>
      {/* Memoized Persistent Mesh Background */}
      <MeshBackground resolvedMode={resolvedMode as 'light' | 'dark'} />

      <View style={styles.content}>
        <Animated.Text style={[styles.quote, { color: colors.text }, taglineStyle]} key={i}>
          {QUOTES[i]}
        </Animated.Text>

        {typeof queueSize === 'number' && queueSize > 2 && (
          <Text style={[styles.queue, { color: resolvedMode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }]}>
            {queueSize} waiting
          </Text>
        )}

        <AnimatedPressable
          accessibilityRole="button"
          onPress={() => {
            console.log('[SC] Find button pressed')
            // Add a fun little click animation
            pulse.value = withTiming(0.9, { duration: 100 }, () => {
              pulse.value = withRepeat(
                withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
              )
            })
            connectAndFind()
          }}
          style={[styles.btn, { backgroundColor: colors.primaryBg }, buttonStyle]}
        >
          {({ pressed }) => (
            <Text style={[styles.btnText, { color: colors.primaryText, opacity: pressed ? 0.8 : 1 }]}>
              Find Stranger
            </Text>
          )}
        </AnimatedPressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  blob: {
    position: 'absolute',
    width: BLOB_SIZE,
    height: BLOB_SIZE,
    borderRadius: BLOB_SIZE / 2,
    opacity: 0.8,
    filter: Platform.OS === 'web' ? 'blur(60px)' as any : undefined // Add web blur for safety if testing there
  },
  content: {
    maxWidth: 480,
    width: '100%',
    alignItems: 'center',
    gap: 32,
    paddingHorizontal: 24,
    zIndex: 10
  },
  quote: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  queue: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: -16
  },
  btn: {
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 100, // Pill shape
  },
  btnText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5
  }
})
