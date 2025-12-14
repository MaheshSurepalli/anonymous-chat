import { Platform } from 'react-native'
import Constants from 'expo-constants'

// Resolve a WebSocket URL suitable for Android emulator and dev.
export function getWsUrl(): string {
  const extra = (Constants.expoConfig?.extra ?? (Constants.manifest as any)?.extra) as any
  const url = extra?.wsUrl as string | undefined

  if (!url) {
    throw new Error(
      'Missing wsUrl in app.json (expo.extra.wsUrl). Add it to mobile/app.json to avoid duplicated defaults.'
    )
  }

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

