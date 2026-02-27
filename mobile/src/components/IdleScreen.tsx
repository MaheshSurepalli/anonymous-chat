import React, { useEffect } from 'react'
import { View, Text, Pressable, StyleSheet, Dimensions, Platform } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated'
import { BlurView } from 'expo-blur'
import QuoteCycler from './QuoteCycler'
import { useChat } from '../state/ChatContext'
import { useTheme } from '../state/ThemeContext'

const { width, height } = Dimensions.get('window')
const BLOB_SIZE = width * 1.5

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const MeshBackground = React.memo(({ resolvedMode }: { resolvedMode: 'light' | 'dark' }) => {
  const { colors } = useTheme()
  const blob1Rotation = useSharedValue(0)
  const blob2Rotation = useSharedValue(0)
  const blob3Rotation = useSharedValue(0)

  useEffect(() => {
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

  const blob1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: width * 0.1 },
      { translateY: -height * 0.2 },
      { rotate: `${blob1Rotation.value}deg` },
      { translateX: -width * 0.1 },
      { scale: 1.2 }
    ],
    backgroundColor: withTiming(colors.blobPrimary, { duration: 1000 }),
  }))

  const blob2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: -width * 0.3 },
      { translateY: height * 0.2 },
      { rotate: `${blob2Rotation.value}deg` },
      { translateX: width * 0.3 },
      { scale: 1.5 }
    ],
    backgroundColor: withTiming(colors.blobSecondary, { duration: 1000 }),
  }))

  const blob3Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: width * 0.4 },
      { translateY: height * 0.4 },
      { rotate: `${blob3Rotation.value}deg` },
      { translateX: -width * 0.4 },
      { scale: 1.3 }
    ],
    backgroundColor: withTiming(colors.blobTertiary, { duration: 1000 }),
  }))

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Animated.View style={[styles.blob, blob1Style]} />
      <Animated.View style={[styles.blob, blob2Style]} />
      <Animated.View style={[styles.blob, blob3Style]} />
      {/* iOS: BlurView melts blobs beautifully.
          Android: BlurView ignores tint and renders a flat grey film — skip it, use solid overlays instead */}
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={resolvedMode === 'dark' ? 80 : 48}
          tint={resolvedMode === 'dark' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFillObject}
        />
      ) : resolvedMode === 'dark' ? (
        // Android dark: semi-transparent black so blobs glow against the inky background
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
      ) : (
        // Android light: soft white tint, still lets blob color show through
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(255,255,255,0.35)' }]} />
      )}
      {/* Universal theme overlay — very low opacity, just a touch of tint */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.overlay }]} />
    </View>
  )
})

export default function IdleScreen() {
  const { connectAndFind, queueSize } = useChat()
  const { colors, resolvedMode } = useTheme()

  const pulse = useSharedValue(1)

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  }, [])

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    shadowColor: colors.accentGlow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 15 * pulse.value,
    elevation: 10 * pulse.value,
    opacity: pulse.value * 0.8 + 0.2,
  }))

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <MeshBackground resolvedMode={resolvedMode as 'light' | 'dark'} />

      <View style={styles.content}>
        {/* Animated quote cycler — manages its own interval + Reanimated transitions */}
        <QuoteCycler />

        {typeof queueSize === 'number' && queueSize > 2 && (
          <Text style={[styles.queue, { color: colors.textSecondary }]}>
            {queueSize} waiting
          </Text>
        )}

        <AnimatedPressable
          accessibilityRole="button"
          onPress={() => {
            console.log('[SC] Find button pressed')
            pulse.value = withTiming(0.9, { duration: 100 }, () => {
              pulse.value = withRepeat(
                withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
              )
            })
            connectAndFind()
          }}
          style={[styles.btn, { backgroundColor: colors.accentStart }, buttonStyle]}
        >
          {({ pressed }) => (
            <Text style={[styles.btnText, { color: colors.textPrimary, opacity: pressed ? 0.8 : 1 }]}>
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
    filter: Platform.OS === 'web' ? 'blur(60px)' as any : undefined
  },
  content: {
    maxWidth: 480,
    width: '100%',
    alignItems: 'center',
    gap: 32,
    paddingHorizontal: 24,
    zIndex: 10
  },
  queue: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: -16
  },
  btn: {
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 100,
  },
  btnText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5
  }
})
