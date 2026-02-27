import React, { useEffect, useState, useCallback } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../state/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type EndChatBottomSheetProps = {
    open: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

export default function EndChatBottomSheet({ open, onConfirm, onCancel }: EndChatBottomSheetProps) {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    const [visible, setVisible] = useState(open);

    const translateY = useSharedValue(SCREEN_HEIGHT);
    const backdropOpacity = useSharedValue(0);

    useEffect(() => {
        if (open) {
            setVisible(true);
            translateY.value = withSpring(0, { damping: 24, stiffness: 200, mass: 0.8 });
            backdropOpacity.value = withTiming(1, { duration: 200 });
        } else if (visible) {
            closeAnimation(() => setVisible(false));
        }
    }, [open, visible]);

    const closeAnimation = useCallback((callback?: () => void) => {
        backdropOpacity.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 }, () => {
            if (callback) runOnJS(callback)();
        });
    }, [translateY, backdropOpacity]);

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
            if (event.translationY > 0) {
                translateY.value = event.translationY;
            } else {
                translateY.value = event.translationY * 0.2;
            }
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

    return (
        <Modal transparent visible={visible} onRequestClose={handleCancel} animationType="none">
            <GestureHandlerRootView style={styles.container}>
                <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
                    <Pressable style={styles.backdropPressable} onPress={handleCancel} />
                </Animated.View>

                <GestureDetector gesture={pan}>
                    <Animated.View style={[
                        styles.sheet,
                        { paddingBottom: Math.max(insets.bottom, 24), shadowColor: colors.accentStart }
                        , animatedSheetStyle
                    ]}>
                        {/* Theme-aware gradient background */}
                        <LinearGradient
                            colors={[colors.sheetGradientTop, colors.sheetGradientBottom] as const}
                            style={StyleSheet.absoluteFillObject}
                        />

                        <View style={styles.dragPillContainer}>
                            <View style={[styles.dragPill, { backgroundColor: colors.dragPill }]} />
                        </View>

                        <View style={styles.content}>
                            <Text style={[styles.title, { color: colors.textPrimary }]}>Vibe check failed?</Text>
                            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Are you sure you want to ghost this stranger?</Text>

                            <View style={styles.actions}>
                                <Pressable
                                    onPress={handleCancel}
                                    style={({ pressed }) => [
                                        styles.keepChattingBtn,
                                        { shadowColor: colors.accentEnd },
                                        pressed && { opacity: 0.8 }
                                    ]}
                                >
                                    <LinearGradient
                                        colors={[colors.sheetKeepGradientStart, colors.sheetKeepGradientEnd] as const}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.keepChattingGradient}
                                    >
                                        <Text style={styles.keepChattingText}>Keep Chatting</Text>
                                    </LinearGradient>
                                </Pressable>

                                <Pressable
                                    onPress={handleConfirm}
                                    style={({ pressed }) => [
                                        styles.endChatBtn,
                                        { borderColor: colors.danger },
                                        pressed && { backgroundColor: colors.dangerPressedBg }
                                    ]}
                                >
                                    <Text style={[styles.endChatText, { color: colors.danger }]}>End Chat</Text>
                                </Pressable>
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
        overflow: 'hidden',
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
        paddingTop: 8,
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
    keepChattingBtn: {
        width: '100%',
        borderRadius: 100,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    keepChattingGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        borderRadius: 100,
    },
    keepChattingText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    endChatBtn: {
        width: '100%',
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 100,
        borderWidth: 2,
    },
    endChatText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
