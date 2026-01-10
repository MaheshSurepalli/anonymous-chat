import { Stack } from 'expo-router'
import { ChatProvider } from '../src/state/ChatContext'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider, useTheme } from '../src/state/ThemeContext'

function RootInner() {
  const { mode } = useTheme()
  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ChatProvider>
          <RootInner />
        </ChatProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
