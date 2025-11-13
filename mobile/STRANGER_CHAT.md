Stranger Chat mobile setup

- WebSocket URL
  - Default for Android emulator is `ws://10.0.2.2:8000/ws` via `app.json > expo.extra.wsUrl`.
  - Override with `EXPO_PUBLIC_WS_URL` at build time (e.g. `EXPO_PUBLIC_WS_URL=ws://192.168.1.100:8000/ws npx expo start`).
  - If you use `localhost`, Android maps it to `10.0.2.2` automatically in the app.

- Run against backend
  1. Start backend (example): `uvicorn backend.app.main:app --host 0.0.0.0 --port 8000`.
  2. From `mobile/`, run `npm install` then `npm run android` (or `npx expo start --android`).

- Features
  - Anonymous matching via `join_queue`.
  - Real-time messages with echo suppression.
  - Typing indicator (debounced, auto-clears after inactivity).
  - Next/End chat with confirmation dialogs.

- Notes
  - Cleartext `ws://` is enabled for Android debug (`usesCleartextTraffic` in app.json). Prefer `wss://` in prod.

