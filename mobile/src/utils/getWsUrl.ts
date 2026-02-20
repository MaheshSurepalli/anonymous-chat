import Constants from 'expo-constants'

export function getWsUrl(): string {
  // Dev: reads from .env (EXPO_PUBLIC_WS_URL=ws://<your-ip>:8000/ws)
  if (__DEV__) {
    const url = process.env.EXPO_PUBLIC_WS_URL;
    if (!url) {
      console.warn('[WS] EXPO_PUBLIC_WS_URL not set in .env — update mobile/.env with your LAN IP');
    }
    return url ?? 'ws://localhost:8000/ws';
  }

  // Prod: reads from app.json → expo.extra.wsUrl
  const extra = (Constants.expoConfig?.extra ?? (Constants.manifest as any)?.extra) as any;
  const url = extra?.wsUrl as string | undefined;

  if (!url) {
    throw new Error('Missing wsUrl in app.json (expo.extra.wsUrl).');
  }

  return url;
}
