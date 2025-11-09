# Backend

Run locally:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000


---

## Frontend (React 18 + Vite + Tailwind v4.1 + Zustand + Radix Dialog + Framer Motion + Howler + Day.js + clsx)

> Tailwind v4.1 zero‑config: we simply `@import "tailwindcss"` in the HTML using the new CDN‑less build (Vite + PostCSS loads it automatically). Dark mode uses the `.dark` class on `<html>`.

### `frontend/package.json`
```json
{
  "name": "stranger-chat-frontend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@radix-ui/react-dialog": "^1.0.5",
    "clsx": "^2.1.0",
    "dayjs": "^1.11.13",
    "framer-motion": "^11.0.0",
    "howler": "^2.2.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.5.2"
  },
  "devDependencies": {
    "@types/node": "^20.11.30",
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^4.1.0",
    "typescript": "^5.6.2",
    "vite": "^5.4.0"
  }
}