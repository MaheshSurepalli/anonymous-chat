import React, { useEffect, useState, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    Pressable,
    StyleSheet,
    Dimensions,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../state/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type SheetType = 'CANCEL_SEARCH' | 'END_CHAT' | 'SKIP';

type SheetConfig = {
    title: string;
    subtitle: string;
    cancelLabel: string;
    confirmLabel: string;
    /** If true, the confirm button uses danger styling; cancel button gets the gradient */
    confirmIsDanger: boolean;
};

const SHEET_CONFIGS: Record<SheetType, SheetConfig> = {
    CANCEL_SEARCH: {
        title: 'Stop looking?',
        subtitle: 'The perfect stranger might be next.',
        cancelLabel: 'Keep Searching',
        confirmLabel: 'Stop',
        confirmIsDanger: true,
    },
    END_CHAT: {
        title: 'Vibe check failed?',
        subtitle: 'Are you sure you want to ghost?',
        cancelLabel: 'Keep Chatting',
        confirmLabel: 'End Chat',
        confirmIsDanger: true,
    },
    SKIP: {
        title: 'Onto the next one?',
        subtitle: 'Leave this chat and find someone new?',
        cancelLabel: 'Cancel',
        confirmLabel: 'Skip',
        confirmIsDanger: false,
    },
};

type AppBottomSheetProps = {
    type: SheetType;
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

export default function AppBottomSheet({
    type,
    open,
    onConfirm,
    onCancel,
}: AppBottomSheetProps) {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    const [visible, setVisible] = useState(open);

    const translateY = useSharedValue(SCREEN_HEIGHT);
    const backdropOpacity = useSharedValue(0);

    const closeAnimation = useCallback(
        (callback?: () => void) => {
            backdropOpacity.value = withTiming(0, { duration: 200 });
            translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () => {
                if (callback) runOnJS(callback)();
            });
        },
        [translateY, backdropOpacity],
    );

    useEffect(() => {
        if (open) {
            setVisible(true);
            translateY.value = withSpring(0, { damping: 24, stiffness: 200, mass: 0.8 });
            backdropOpacity.value = withTiming(1, { duration: 200 });
        } else if (visible) {
            closeAnimation(() => setVisible(false));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleCancel = useCallback(() => {
        closeAnimation(() => {
            setVisible(false);
            onCancel();
        });
    }, [closeAnimation, onCancel]);

    const handleConfirm = useCallback(() => {
        closeAnimation(() => {
            setVisible(false);
            onConfirm();
        });
    }, [closeAnimation, onConfirm]);

    const pan = Gesture.Pan()
        .onChange((event) => {
            translateY.value =
                event.translationY > 0
                    ? event.translationY
                    : event.translationY * 0.2;
        })
        .onEnd((event) => {
            if (event.translationY > 150 || event.velocityY > 500) {
                runOnJS(handleCancel)();
            } else {
                translateY.value = withSpring(0, { damping: 24, stiffness: 200, mass: 0.8 });
            }
        });

    const animatedSheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const animatedBackdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }));

    const config = SHEET_CONFIGS[type];

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} onRequestClose={handleCancel} animationType="none">
            <GestureHandlerRootView style={styles.container}>
                {/* Backdrop */}
                <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
                    <Pressable style={styles.backdropPressable} onPress={handleCancel} />
                </Animated.View>

                {/* Sheet */}
                <GestureDetector gesture={pan}>
                    <Animated.View
                        style={[
                            styles.sheet,
                            { backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom, 24), shadowColor: colors.accentStart },
                            animatedSheetStyle,
                        ]}
                    >
                        {/* Drag pill */}
                        <View style={styles.dragPillContainer}>
                            <View style={[styles.dragPill, { backgroundColor: colors.border }]} />
                        </View>

                        {/* Content */}
                        <View style={styles.content}>
                            <Text style={[styles.title, { color: colors.text }]}>{config.title}</Text>
                            <Text style={[styles.subtitle, { color: colors.muted }]}>{config.subtitle}</Text>

                            <View style={styles.actions}>
                                {/* ── Primary button: gradient for cancel (keep/stay) or confirm (skip) ── */}
                                {config.confirmIsDanger ? (
                                    // Danger layout: gradient for "keep", ghost-danger for "action"
                                    <>
                                        <Pressable
                                            onPress={handleCancel}
                                            style={({ pressed }) => [
                                                styles.gradientBtn,
                                                { shadowColor: colors.accentEnd },
                                                pressed && { opacity: 0.8 }
                                            ]}
                                        >
                                            <LinearGradient
                                                colors={[colors.sheetKeepGradientStart, colors.sheetKeepGradientEnd] as const}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.gradientBtnInner}
                                            >
                                                <Text style={styles.gradientBtnText}>{config.cancelLabel}</Text>
                                            </LinearGradient>
                                        </Pressable>

                                        <Pressable
                                            onPress={handleConfirm}
                                            style={({ pressed }) => [
                                                styles.ghostBtn,
                                                { borderColor: colors.danger },
                                                pressed && { backgroundColor: colors.dangerPressedBg },
                                            ]}
                                        >
                                            <Text style={[styles.ghostBtnText, { color: colors.danger }]}>
                                                {config.confirmLabel}
                                            </Text>
                                        </Pressable>
                                    </>
                                ) : (
                                    // Non-danger layout (SKIP): ghost for "cancel", gradient for "confirm"
                                    <>
                                        <Pressable
                                            onPress={handleConfirm}
                                            style={({ pressed }) => [
                                                styles.gradientBtn,
                                                { shadowColor: colors.accentEnd },
                                                pressed && { opacity: 0.8 }
                                            ]}
                                        >
                                            <LinearGradient
                                                colors={[colors.sheetKeepGradientStart, colors.sheetKeepGradientEnd] as const}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.gradientBtnInner}
                                            >
                                                <Text style={styles.gradientBtnText}>{config.confirmLabel}</Text>
                                            </LinearGradient>
                                        </Pressable>

                                        <Pressable
                                            onPress={handleCancel}
                                            style={({ pressed }) => [
                                                styles.ghostBtn,
                                                { borderColor: colors.border },
                                                pressed && { opacity: 0.7 },
                                            ]}
                                        >
                                            <Text style={[styles.ghostBtnText, { color: colors.text }]}>
                                                {config.cancelLabel}
                                            </Text>
                                        </Pressable>
                                    </>
                                )}
                            </View>
                        </View>
                    </Animated.View>
                </GestureDetector>
            </GestureHandlerRootView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backdropPressable: {
        flex: 1,
    },
    sheet: {
        width: '100%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 20,
    },
    dragPillContainer: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    dragPill: {
        width: 40,
        height: 5,
        borderRadius: 3,
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 4,
        paddingBottom: 8,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    actions: {
        width: '100%',
        gap: 16,
    },
    gradientBtn: {
        width: '100%',
        borderRadius: 100,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    gradientBtnInner: {
        paddingVertical: 16,
        alignItems: 'center',
        borderRadius: 100,
    },
    gradientBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    ghostBtn: {
        width: '100%',
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 100,
        borderWidth: 2,
    },
    ghostBtnText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
