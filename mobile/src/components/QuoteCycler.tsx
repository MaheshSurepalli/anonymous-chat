/**
 * QuoteCycler
 * -----------
 * Cycles through Gen-Z themed quotes every 4 seconds with a buttery
 * cross-fade + slide animation: outgoing text fades out & slides DOWN,
 * incoming text fades in & slides UP from below.
 */
import React, { useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
} from 'react-native-reanimated'
import { useTheme } from '../state/ThemeContext'

// ─── Copywriting ──────────────────────────────────────────────────────────────

const QUOTES = [
    "Maybe they're cool. Maybe they're chaos.",
    'Find your new bestie. Or your new nemesis.',
    'Main character energy only.',
    'Skip the small talk.',
    'No receipts. No regrets. Just vibes.',
    'One message away from a new story.',
    'Anonymity unlocked. Vibe detected.',
    'Zero context. Infinite potential.',
    'Stranger danger? More like stranger banger.',
    'Two bubbles. One spark. Zero cringe.',
    'Say hi. Worst case — a story.',
    'Your next situationship starts here.',
    "They won't know your name. They'll know your vibe.",
    'New energy. Every. Single. Time.',
    'Anonymous. Unfiltered. Iconic.',
]

// ─── Component ────────────────────────────────────────────────────────────────

const CYCLE_MS = 4000        // time between transitions
const OUT_DURATION = 280     // outgoing fade+slide duration
const IN_DURATION = 380     // incoming fade+slide duration
const SLIDE_AMOUNT = 18      // px of vertical travel

export default function QuoteCycler() {
    const { colors } = useTheme()

    // Track which two quotes we're cross-fading between
    const [currentIndex, setCurrentIndex] = useState(0)
    const [nextIndex, setNextIndex] = useState(1)
    const [phase, setPhase] = useState<'idle' | 'out' | 'in'>('idle')

    // Shared values for the two text layers
    const currentOpacity = useSharedValue(1)
    const currentTranslateY = useSharedValue(0)
    const nextOpacity = useSharedValue(0)
    const nextTranslateY = useSharedValue(SLIDE_AMOUNT)

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const runTransition = () => {
        setPhase('out')

        // ── Phase 1: Outgoing slide DOWN + fade out ──────────────────────────
        const outEasing = Easing.in(Easing.quad)
        currentOpacity.value = withTiming(0, { duration: OUT_DURATION, easing: outEasing })
        currentTranslateY.value = withTiming(SLIDE_AMOUNT, { duration: OUT_DURATION, easing: outEasing })

        // ── Phase 2 (after out finishes): Swap text → incoming slide UP + fade in
        timerRef.current = setTimeout(() => {
            setCurrentIndex((prev) => {
                const next = (prev + 1) % QUOTES.length
                setNextIndex((next + 1) % QUOTES.length)
                return next
            })

            // Reset next layer to start position (below, invisible)
            nextOpacity.value = 0
            nextTranslateY.value = SLIDE_AMOUNT

            // Snap current back (it now holds the new quote)
            currentOpacity.value = 0
            currentTranslateY.value = -SLIDE_AMOUNT   // start above

            const inEasing = Easing.out(Easing.cubic)
            currentOpacity.value = withTiming(1, { duration: IN_DURATION, easing: inEasing })
            currentTranslateY.value = withTiming(0, { duration: IN_DURATION, easing: inEasing })

            setPhase('idle')
        }, OUT_DURATION + 40) // small gap between out and in
    }

    useEffect(() => {
        const interval = setInterval(runTransition, CYCLE_MS)
        return () => {
            clearInterval(interval)
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [])

    const currentStyle = useAnimatedStyle(() => ({
        opacity: currentOpacity.value,
        transform: [{ translateY: currentTranslateY.value }],
    }))

    return (
        <View style={styles.container} pointerEvents="none">
            <Animated.Text
                style={[styles.quote, { color: colors.textPrimary }, currentStyle]}
                numberOfLines={3}
                adjustsFontSizeToFit
            >
                {QUOTES[currentIndex]}
            </Animated.Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        height: 110,              // Fixed height prevents layout shift during transition
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        paddingHorizontal: 8,
    },
    quote: {
        fontSize: 26,
        fontWeight: '800',
        textAlign: 'center',
        lineHeight: 34,
        letterSpacing: -0.4,
    },
})
