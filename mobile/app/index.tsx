import React from 'react'
import { KeyboardAvoidingView, Platform, View } from 'react-native'
import { useChat } from '../src/state/ChatContext'
import HeaderBar from '../src/components/HeaderBar'
import IdleScreen from '../src/components/IdleScreen'
import SearchingScreen from '../src/components/SearchingScreen'
import MessageList from '../src/components/MessageList'
import MessageInput from '../src/components/MessageInput'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../src/state/ThemeContext'

export default function Index() {
  const { status } = useChat()
  const { colors } = useTheme()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['left','right','bottom']}>
      <HeaderBar />
      {status === 'idle' && <IdleScreen />}
      {status === 'searching' && <SearchingScreen />}
      {status === 'matched' && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          // offset the header/safe-area so the input lifts fully above the keyboard
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
        >
          <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <MessageList />
            <MessageInput />
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  )
}
