import React from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  withSequence,
  Easing,
  runOnJS
} from 'react-native-reanimated'
import { useTheme } from '../state/ThemeContext'

const TEXTS = [
  'Scanning for vibes...',
  'Checking compatibility...',
  'Interfering with timelines...',
  'Finding a match...',
  'Tuning frequencies...',
]

const { width } = Dimensions.get('window')
const RIPPLE_SIZE = width * 0.4

const Ripple = ({ delay, color }: { delay: number; color: string }) => {
  const scale = useSharedValue(0)
  const opacity = useSharedValue(0.6)

  React.useEffect(() => {
    // Expand to 3x the base size
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(3, { duration: 3000, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    )
    // Fade out as it expands
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0, { duration: 3000, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    )
  }, [delay, scale, opacity])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
      backgroundColor: color,
    }
  })

  return <Animated.View style={[styles.ripple, animatedStyle]} />
}

export default function SearchingScreen() {
  const { colors } = useTheme()
  const [index, setIndex] = React.useState(0)

  // Start from 0 so we can fade it in
  const textOpacity = useSharedValue(0)

  React.useEffect(() => {
    let isActive = true

    // Fade in text, hold it, then fade out text
    textOpacity.value = withSequence(
      withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      withDelay(
        2000, // hold
        withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) }, (finished) => {
          if (finished && isActive) {
            // Schedule the index to update, triggering re-render and another effect cycle
            runOnJS(setIndex)((index + 1) % TEXTS.length)
          }
        })
      )
    )

    return () => {
      // Avoid scheduling state updates if unmounted or if index changes
      isActive = false
    }
  }, [index, textOpacity])

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
    }
  })

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.radarContainer}>
        {/* Central static core */}
        <View style={[styles.centralCore, { backgroundColor: colors.primaryBg }]} />

        {/* Concentric ripples */}
        <Ripple delay={0} color={colors.primaryBg} />
        <Ripple delay={1000} color={colors.primaryBg} />
        <Ripple delay={1500} color={colors.primaryBg} />
      </View>

      <Animated.Text style={[styles.text, animatedTextStyle, { color: colors.muted }]}>
        {TEXTS[index]}
      </Animated.Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 80 // Provide visual balance between the large radar and text
  },
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centralCore: {
    position: 'absolute',
    width: RIPPLE_SIZE / 4,
    height: RIPPLE_SIZE / 4,
    borderRadius: RIPPLE_SIZE / 8,
    zIndex: 10, // Must be above the expanding waves
  },
  ripple: {
    position: 'absolute',
    width: RIPPLE_SIZE,
    height: RIPPLE_SIZE,
    borderRadius: RIPPLE_SIZE / 2,
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
})
