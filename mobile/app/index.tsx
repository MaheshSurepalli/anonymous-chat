import React from 'react'
import { Platform, View, Animated } from 'react-native'
import { useKeyboardAnimation } from 'react-native-keyboard-controller'
import { useChat } from '../src/state/ChatContext'
import HeaderBar from '../src/components/HeaderBar'
import IdleScreen from '../src/components/IdleScreen'
import SearchingScreen from '../src/components/SearchingScreen'
import MessageList from '../src/components/MessageList'
import MessageInput from '../src/components/MessageInput'
import TutorialOverlay from '../src/components/TutorialOverlay'
import { useTheme } from '../src/state/ThemeContext'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function Index() {
  const { status } = useChat()
  const { colors } = useTheme()
  const { height, progress } = useKeyboardAnimation()
  const insets = useSafeAreaInsets()

  const animatedStyle = {
    flex: 1,
    transform: [{ translateY: Animated.add(height, Animated.multiply(progress, insets.bottom)) }],
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <HeaderBar />
      {status === 'idle' && <IdleScreen />}
      {status === 'searching' && <SearchingScreen />}
      {status === 'matched' && (
        <Animated.View style={animatedStyle}>
          <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <MessageList />
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
              <MessageInput />
            </View>
          </View>
        </Animated.View>
      )}
      <TutorialOverlay />
    </View>
  )
}
