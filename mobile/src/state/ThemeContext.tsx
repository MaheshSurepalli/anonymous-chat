import React, { createContext, useContext, useMemo, useState } from 'react'
import { Appearance } from 'react-native'

type ThemeMode = 'light' | 'dark' | 'system'

export type Colors = {
  // ── Backgrounds ──────────────────────────────────────────────
  bg: string              // Main screen background
  surface: string         // Cards, bottom sheets, elevated surfaces

  // ── Text ─────────────────────────────────────────────────────
  textPrimary: string     // Primary body/heading text
  textSecondary: string   // Muted / secondary text

  // ── Primary Accent (Gradient) ────────────────────────────────
  accentStart: string     // Gradient start — purple
  accentEnd: string       // Gradient end   — pink
  accentGlow: string      // Shadow/glow color for accent elements

  // ── Status ───────────────────────────────────────────────────
  danger: string          // Destructive actions (red)
  dangerPressedBg: string // Danger button pressed state bg

  // ── Borders / Dividers ───────────────────────────────────────
  border: string          // Hairline borders

  // ── Message Input ────────────────────────────────────────────
  inputBg: string
  inputPlaceholder: string
  sendDisabledBg: string
  sendDisabledText: string

  // ── Chat Bubbles ─────────────────────────────────────────────
  bubbleOtherBg: string   // Received bubble background
  bubbleOtherText: string // Received bubble text

  // ── Icebreaker Chips ─────────────────────────────────────────
  icebreakerBg: string
  icebreakerBgPressed: string

  // ── Bottom Sheet ─────────────────────────────────────────────
  sheetGradientTop: string
  sheetGradientBottom: string
  sheetKeepGradientStart: string
  sheetKeepGradientEnd: string
  dragPill: string

  // ── Idle / Mesh Background ───────────────────────────────────
  blobPrimary: string
  blobSecondary: string
  blobTertiary: string
  overlay: string         // Mesh soft overlay

  // ── Backward-compat aliases (for components already using old names) ──
  text: string            // → textPrimary
  muted: string           // → textSecondary
  card: string            // → surface
  primaryBg: string       // → accentStart (solid accent for buttons)
  primaryText: string     // → textPrimary (text on accent bg)
  dangerBg: string        // → danger
  bubbleOther: string     // → icebreakerBg (used in SettingsDialog)
  bubbleTextOther: string // → bubbleOtherText
  bubbleMine: string      // kept for any direct refs, maps to accentStart
  bubbleTextMine: string  // white
}

const darkColors: Colors = {
  // ── Backgrounds
  bg: '#0A0A0E',
  surface: '#1A1A24',

  // ── Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',

  // ── Accent
  accentStart: '#A855F7',
  accentEnd: '#EC4899',
  accentGlow: '#A855F7',

  // ── Status
  danger: '#EF4444',
  dangerPressedBg: '#3A1515',

  // ── Borders
  border: 'rgba(255,255,255,0.1)',

  // ── Input
  inputBg: 'rgba(0,0,0,0.2)',
  inputPlaceholder: 'rgba(255,255,255,0.5)',
  sendDisabledBg: '#374151',
  sendDisabledText: '#9ca3af',

  // ── Bubbles
  bubbleOtherBg: '#2A2A2A',
  bubbleOtherText: '#FFFFFF',

  // ── Icebreakers
  icebreakerBg: '#1f2937',
  icebreakerBgPressed: '#374151',

  // ── Bottom Sheet
  sheetGradientTop: '#251b33',
  sheetGradientBottom: '#110F15',
  sheetKeepGradientStart: '#8A2BE2',
  sheetKeepGradientEnd: '#BF40FF',
  dragPill: '#4A4A5A',

  // ── Mesh / Blobs
  blobPrimary: '#BF5FFF',    // vivid violet — punches through the black overlay
  blobSecondary: '#3B82F6',  // electric blue
  blobTertiary: '#FF3B91',   // hot neon pink
  overlay: 'rgba(0,0,0,0.0)', // Android handles its own overlay; iOS BlurView handles dark tint

  // ── Aliases
  text: '#FFFFFF',
  muted: '#A1A1AA',
  card: '#1A1A24',
  primaryBg: '#A855F7',
  primaryText: '#FFFFFF',
  dangerBg: '#EF4444',
  bubbleOther: '#1f2937',
  bubbleTextOther: '#FFFFFF',
  bubbleMine: '#A855F7',
  bubbleTextMine: '#FFFFFF',
}

const lightColors: Colors = {
  // ── Backgrounds
  bg: '#F8FAFC',
  surface: '#FFFFFF',

  // ── Text
  textPrimary: '#0F172A',
  textSecondary: '#64748B',

  // ── Accent
  accentStart: '#8B5CF6',
  accentEnd: '#D946EF',
  accentGlow: '#8B5CF6',

  // ── Status
  danger: '#EF4444',
  dangerPressedBg: '#FFF0F0',

  // ── Borders
  border: 'rgba(0,0,0,0.1)',

  // ── Input
  inputBg: 'rgba(255,255,255,0.3)',
  inputPlaceholder: 'rgba(0,0,0,0.4)',
  sendDisabledBg: '#e5e7eb',
  sendDisabledText: '#6b7280',

  // ── Bubbles
  bubbleOtherBg: '#F0F0F0',
  bubbleOtherText: '#111827',

  // ── Icebreakers
  icebreakerBg: '#FFFFFF',
  icebreakerBgPressed: '#f3f4f6',

  // ── Bottom Sheet
  sheetGradientTop: '#ffffff',
  sheetGradientBottom: '#f5f5f5',
  sheetKeepGradientStart: '#8B5CF6',
  sheetKeepGradientEnd: '#D946EF',
  dragPill: '#E0E0E0',

  // ── Mesh / Blobs
  blobPrimary: '#C084FC',    // vibrant purple
  blobSecondary: '#60A5FA',  // vivid blue
  blobTertiary: '#F472B6',   // hot pink
  overlay: 'rgba(255,255,255,0.25)',

  // ── Aliases
  text: '#0F172A',
  muted: '#64748B',
  card: '#FFFFFF',
  primaryBg: '#8B5CF6',
  primaryText: '#FFFFFF',
  dangerBg: '#EF4444',
  bubbleOther: '#f3f4f6',
  bubbleTextOther: '#111827',
  bubbleMine: '#8B5CF6',
  bubbleTextMine: '#FFFFFF',
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
  const [systemMode, setSystemMode] = useState<'light' | 'dark'>(
    systemColorScheme === 'dark' ? 'dark' : 'light'
  )

  React.useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemMode(colorScheme === 'dark' ? 'dark' : 'light')
    })
    return () => subscription.remove()
  }, [])

  const resolvedMode = mode === 'system' ? systemMode : mode
  const colors = resolvedMode === 'dark' ? darkColors : lightColors

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolvedMode,
      colors,
      toggle: () =>
        setMode((m) => {
          if (m === 'system') return resolvedMode === 'dark' ? 'light' : 'dark'
          return m === 'dark' ? 'light' : 'dark'
        }),
      setMode,
    }),
    [mode, resolvedMode, colors]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
