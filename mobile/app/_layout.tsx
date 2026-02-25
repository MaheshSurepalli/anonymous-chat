import { Stack } from 'expo-router'
import { ChatProvider } from '../src/state/ChatContext'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider, useTheme } from '../src/state/ThemeContext'
import { OnboardingProvider } from '../src/state/OnboardingContext'

function RootInner() {
  const { resolvedMode } = useTheme()
  return (
    <>
      <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} translucent={true} backgroundColor="transparent" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <OnboardingProvider>
          <ChatProvider>
            <RootInner />
          </ChatProvider>
        </OnboardingProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
