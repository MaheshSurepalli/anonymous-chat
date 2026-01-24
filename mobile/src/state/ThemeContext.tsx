import React, { createContext, useContext, useMemo, useState } from 'react'
import { Appearance, ColorSchemeName } from 'react-native'

type ThemeMode = 'light' | 'dark' | 'system'

type Colors = {
  bg: string
  text: string
  muted: string
  border: string
  card: string
  primaryBg: string
  primaryText: string
  dangerBg: string
  bubbleMine: string
  bubbleOther: string
  bubbleTextMine: string
  bubbleTextOther: string
}

const lightColors: Colors = {
  bg: '#ffffff',
  text: '#111827',
  muted: '#6b7280',
  border: '#e5e7eb',
  card: '#ffffff',
  primaryBg: '#0a0a0a',
  primaryText: '#ffffff',
  dangerBg: '#ef4444',
  bubbleMine: '#0a0a0a',
  bubbleOther: '#f3f4f6',
  bubbleTextMine: '#ffffff',
  bubbleTextOther: '#111827',
}

const darkColors: Colors = {
  bg: '#0b0b0b',
  text: '#e5e7eb',
  muted: '#9ca3af',
  border: '#27272a',
  card: '#111113',
  primaryBg: '#e5e7eb',
  primaryText: '#0b0b0b',
  dangerBg: '#ef4444',
  bubbleMine: '#e5e7eb',
  bubbleOther: '#1f2937',
  bubbleTextMine: '#0b0b0b',
  bubbleTextOther: '#e5e7eb',
}

type ThemeContextValue = {
  mode: ThemeMode
  resolvedMode: 'light' | 'dark'
  colors: Colors
  toggle: () => void
  setMode: (m: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = Appearance.getColorScheme()
  const [mode, setMode] = useState<ThemeMode>('system')
  const [systemMode, setSystemMode] = useState<'light' | 'dark'>(systemColorScheme === 'dark' ? 'dark' : 'light')

  React.useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemMode(colorScheme === 'dark' ? 'dark' : 'light')
    })
    return () => subscription.remove()
  }, [])

  const resolvedMode = mode === 'system' ? systemMode : mode
  const colors = resolvedMode === 'dark' ? darkColors : lightColors

  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    resolvedMode,
    colors,
    toggle: () => setMode((m) => {
      if (m === 'system') return resolvedMode === 'dark' ? 'light' : 'dark'
      return m === 'dark' ? 'light' : 'dark'
    }),
    setMode,
  }), [mode, resolvedMode, colors])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

