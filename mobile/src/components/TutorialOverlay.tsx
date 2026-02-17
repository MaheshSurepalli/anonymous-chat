import React from 'react'
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native'
import { useOnboarding, TutorialStep } from '../state/OnboardingContext'
import { useTheme } from '../state/ThemeContext'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width, height } = Dimensions.get('window')

export default function TutorialOverlay() {
    const { activeStep, nextStep, skipTutorial } = useOnboarding()
    const { colors } = useTheme()

    if (!activeStep) return null

    const getStepContent = (step: TutorialStep) => {
        switch (step) {
            case 'welcome':
                return {
                    title: 'Welcome to Stranger Chat!',
                    text: 'Connect anonymously with random people around the world. No login required.',
                    position: 'center',
                    arrow: null
                }
            case 'settings':
                return {
                    title: 'Customize Your Experience',
                    text: 'Tap here to change themes (Dark/Light) or view our Privacy Policy.',
                    position: 'top-right',
                    arrow: 'top-right'
                }
            case 'start':
                return {
                    title: 'Start Chatting',
                    text: 'Tap the big button to find a partner instantly!',
                    position: 'center-bottom',
                    arrow: 'top-center'
                }
            default:
                return null
        }
    }

    const content = getStepContent(activeStep)
    if (!content) return null

    return (
        <View style={styles.overlay}>
            {/* Dimmed Background */}
            <View style={StyleSheet.absoluteFillObject} />

            <SafeAreaView style={styles.safeArea}>
                {/* Content Positioning */}
                <View style={[
                    styles.cardContainer,
                    content.position === 'center' && styles.centered,
                    content.position === 'top-right' && styles.topRight,
                    content.position === 'center-bottom' && styles.centerBottom,
                ]}>
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.primaryBg }]}>
                        {/* Arrow */}
                        {content.arrow === 'top-right' && (
                            <View style={[styles.arrow, styles.arrowTopRight, { borderBottomColor: colors.card, top: -10 }]} />
                        )}
                        {content.arrow === 'top-center' && (
                            <View style={[styles.arrow, styles.arrowTopCenter, { borderBottomColor: colors.card, top: -10 }]} />
                        )}

                        <Text style={[styles.title, { color: colors.text }]}>{content.title}</Text>
                        <Text style={[styles.text, { color: colors.muted }]}>{content.text}</Text>

                        <View style={styles.actions}>
                            <Pressable onPress={skipTutorial}>
                                <Text style={[styles.skipBtn, { color: colors.muted }]}>Skip</Text>
                            </Pressable>
                            <Pressable onPress={nextStep} style={[styles.nextBtn, { backgroundColor: colors.primaryBg }]}>
                                <Text style={[styles.nextBtnText, { color: colors.primaryText }]}>
                                    {activeStep === 'start' ? 'Finish' : 'Next'}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    )
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 1000,
    },
    safeArea: { flex: 1 },
    cardContainer: {
        position: 'absolute',
        padding: 20,
        width: '100%',
    },
    centered: {
        top: '40%',
        alignItems: 'center',
    },
    topRight: {
        top: 60,
        alignItems: 'flex-end',
        paddingRight: 24, // shift slightly left so arrow lines up with typical header button
    },
    centerBottom: {
        bottom: '25%', // Raised from 20% to avoid overlap with bottom buttons
        alignItems: 'center',
    },
    card: {
        width: '100%',
        maxWidth: 320,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        position: 'relative', // for arrow positioning
    },
    arrow: {
        position: 'absolute',
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderBottomWidth: 10,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
    },
    arrowTopRight: {
        right: 20,
    },
    arrowTopCenter: {
        alignSelf: 'center',
        left: '50%',
        marginLeft: -10
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    text: {
        fontSize: 16,
        marginBottom: 20,
        lineHeight: 22,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    skipBtn: {
        fontSize: 16,
        padding: 8,
    },
    nextBtn: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 24,
    },
    nextBtnText: {
        fontWeight: '600',
        fontSize: 16,
    },
})
