import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import AppBottomSheet, { SheetType } from './AppBottomSheet'
import SettingsDialog from './SettingsDialog'
import { useChat } from '../state/ChatContext'
import { useTheme } from '../state/ThemeContext'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function HeaderBar() {
  const { status, partner, startedAt, next, leave, typing } = useChat()
  const [active, setActive] = useState<null | 'next' | 'end' | 'cancelSearch' | 'settings'>(null)
  const [now, setNow] = useState(() => Date.now())
  const { mode, colors, resolvedMode } = useTheme()
  const insets = useSafeAreaInsets()

  useEffect(() => {
    if (status !== 'matched' || !startedAt) {
      setNow(Date.now())
      return
    }
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [status, startedAt])

  const timer = useMemo(() => {
    if (!startedAt || Number.isNaN(startedAt)) return null
    const secs = Math.max(0, Math.floor((now - startedAt) / 1000))
    const mm = String(Math.floor(secs / 60)).padStart(2, '0')
    const ss = String(secs % 60).padStart(2, '0')
    return `${mm}:${ss}`
  }, [startedAt, now])

  let statusText = 'Anonymous Chat'
  if (status === 'searching') statusText = 'Looking for someone...'
  else if (status === 'matched') {
    if (typing) statusText = 'Stranger is typing...'
    else statusText = 'Chatting with Stranger'
  }

  // Resolve which sheet type to show based on the active dialog
  const sheetType: SheetType | null =
    active === 'cancelSearch' ? 'CANCEL_SEARCH'
      : active === 'end' ? 'END_CHAT'
        : active === 'next' ? 'SKIP'
          : null

  return (
    <>
      <View
        style={[
          styles.glassHeader,
          {
            paddingTop: insets.top,
            height: insets.top + 60,
            backgroundColor: resolvedMode === 'dark'
              ? 'rgba(10,10,14,0.92)'   // deep space black, nearly opaque
              : 'rgba(248,250,252,0.90)', // off-white
            borderBottomColor: resolvedMode === 'dark'
              ? 'rgba(255,255,255,0.07)'
              : 'rgba(0,0,0,0.06)',
            borderBottomWidth: 1,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.leftCol}>
            {status !== 'idle' && (
              <Pressable
                onPress={() =>
                  setActive(status === 'searching' ? 'cancelSearch' : 'end')
                }
                style={[styles.leaveBtn, { backgroundColor: colors.dangerBg, borderColor: colors.dangerBg }]}
              >
                <Text style={styles.leaveBtnText}>Leave</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.centerCol}>
            <Text style={[styles.title, { color: colors.text }]}>{statusText}</Text>
          </View>

          <View style={styles.rightCol}>
            {status === 'matched' && (
              <Pressable
                onPress={() => setActive('next')}
                style={[styles.nextBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.nextBtnText, { color: colors.text }]}>Next</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      <SettingsDialog
        open={active === 'settings'}
        onClose={() => setActive(null)}
      />

      {sheetType !== null && (
        <AppBottomSheet
          type={sheetType}
          open={sheetType !== null}
          onCancel={() => setActive(null)}
          onConfirm={() => {
            setActive(null)
            if (active === 'next') next()
            else leave()
          }}
        />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  glassHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flex: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerCol: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontWeight: '600',
    fontSize: 16,
  },
  leaveBtn: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  leaveBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
  nextBtn: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  nextBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
})
