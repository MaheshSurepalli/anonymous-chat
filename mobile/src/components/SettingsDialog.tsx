import React, { useState } from 'react'
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native'
import { useTheme } from '../state/ThemeContext'
import { useOnboarding } from '../state/OnboardingContext'
import PrivacyPolicyModal from './PrivacyPolicyModal'

type SettingsDialogProps = {
    open: boolean
    onClose: () => void
}

export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
    const { mode, setMode, colors } = useTheme()
    const { startTutorial } = useOnboarding()
    const [showPrivacy, setShowPrivacy] = useState(false)

    const options = [
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
        { label: 'System', value: 'system' },
    ] as const

    return (
        <>
            <Modal transparent visible={open} animationType="fade" onRequestClose={onClose}>
                <Pressable style={styles.overlay} onPress={onClose}>
                    <Pressable style={[styles.card, { backgroundColor: colors.card }]} onPress={() => { }}>
                        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

                        <Text style={[styles.sectionTitle, { color: colors.muted }]}>Appearance</Text>
                        <View style={styles.optionsContainer}>
                            {options.map((opt) => {
                                const isActive = mode === opt.value
                                return (
                                    <Pressable
                                        key={opt.value}
                                        onPress={() => {
                                            setMode(opt.value)
                                        }}
                                        style={[
                                            styles.option,
                                            { borderColor: isActive ? colors.primaryBg : colors.border },
                                            isActive && { backgroundColor: colors.bubbleOther }
                                        ]}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            { color: colors.text, fontWeight: isActive ? '700' : '400' }
                                        ]}>
                                            {opt.label}
                                        </Text>
                                        {isActive && (
                                            <View style={[styles.radioOuter, { borderColor: colors.primaryBg }]}>
                                                <View style={[styles.radioInner, { backgroundColor: colors.primaryBg }]} />
                                            </View>
                                        )}
                                        {!isActive && (
                                            <View style={[styles.radioOuter, { borderColor: colors.muted }]} />
                                        )}
                                    </Pressable>
                                )
                            })}
                        </View>

                        <Text style={[styles.sectionTitle, { color: colors.muted, marginTop: 16 }]}>Help & About</Text>
                        <View style={{ gap: 8, marginBottom: 24 }}>
                            <Pressable
                                onPress={() => {
                                    onClose()
                                    startTutorial()
                                }}
                                style={[styles.simpleBtn, { borderColor: colors.border, marginBottom: 0 }]}
                            >
                                <Text style={{ color: colors.text, fontSize: 16 }}>Replay Tutorial</Text>
                            </Pressable>

                            <Pressable
                                onPress={() => setShowPrivacy(true)}
                                style={[styles.simpleBtn, { borderColor: colors.border }]}
                            >
                                <Text style={{ color: colors.text, fontSize: 16 }}>Privacy Policy</Text>
                            </Pressable>
                        </View>

                        <View style={styles.row}>
                            <Pressable onPress={onClose} style={[styles.btnOutline, { borderColor: colors.border }]}>
                                <Text style={{ color: colors.text }}>Close</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            <PrivacyPolicyModal
                open={showPrivacy}
                onClose={() => setShowPrivacy(false)}
            />
        </>
    )
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    card: { width: '100%', maxWidth: 360, borderRadius: 16, padding: 16 },
    title: { fontSize: 20, fontWeight: '600', marginBottom: 16 },
    sectionTitle: { fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
    optionsContainer: { gap: 12 },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderWidth: 1,
        borderRadius: 12,
    },
    simpleBtn: {
        padding: 12,
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: 24
    },
    optionText: { fontSize: 16 },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    row: { flexDirection: 'row', justifyContent: 'flex-end' },
    btnOutline: { borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
})
