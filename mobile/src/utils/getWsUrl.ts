import { Platform } from 'react-native'
import Constants from 'expo-constants'

// Resolve a WebSocket URL suitable for Android emulator and dev.
export function getWsUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_WS_URL as string | undefined
  const extraUrl = (Constants.expoConfig?.extra as any)?.wsUrl as string | undefined
  let url = envUrl || extraUrl || 'ws://localhost:8000/ws'

  try {
    const u = new URL(url)
    if (Platform.OS === 'android') {
      if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
        // Map localhost to Android emulator host loopback.
        u.hostname = '10.0.2.2'
      }
    }
    return u.toString()
  } catch {
    return url
  }
}

