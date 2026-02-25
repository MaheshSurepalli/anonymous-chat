import React from 'react'
import { KeyboardAvoidingView, Platform, View } from 'react-native'
import { useChat } from '../src/state/ChatContext'
import HeaderBar from '../src/components/HeaderBar'
import IdleScreen from '../src/components/IdleScreen'
import SearchingScreen from '../src/components/SearchingScreen'
import MessageList from '../src/components/MessageList'
import MessageInput from '../src/components/MessageInput'
import TutorialOverlay from '../src/components/TutorialOverlay'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../src/state/ThemeContext'

export default function Index() {
  const { status } = useChat()
  const { colors } = useTheme()

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50 }} pointerEvents="box-none">
        <HeaderBar />
      </View>
      {status === 'idle' && <IdleScreen />}
      {status === 'searching' && <SearchingScreen />}
      {status === 'matched' && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior="padding"
          // offset the header/safe-area so the input lifts fully above the keyboard
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <MessageList />
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
              <MessageInput />
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
      <TutorialOverlay />
    </View>
  )
}
