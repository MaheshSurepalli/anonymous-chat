import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import ConfirmDialog from './ConfirmDialog'
import SettingsDialog from './SettingsDialog'
import { useChat } from '../state/ChatContext'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../state/ThemeContext'

export default function HeaderBar() {
  const { status, partner, startedAt, next, leave } = useChat()
  const [active, setActive] = useState<null | 'next' | 'end' | 'report' | 'settings'>(null)
  const [now, setNow] = useState(() => Date.now())
  const { mode, colors } = useTheme()

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

  return (
    <>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.card }}>
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {status === 'matched' && partner && (
              <Text style={[styles.sub, { color: colors.muted }]}>{partner.avatar} {timer ?? '--:--'}</Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={() => setActive('settings')} style={[styles.iconBtn, { borderColor: colors.border }]}>
              <Text style={[styles.iconBtnText, { color: colors.text }]}>Settings</Text>
            </Pressable>
            {status === 'matched' && (
              <>
                <Pressable
                  onPress={() => setActive('next')}
                  style={[styles.iconBtn, { borderColor: colors.border }]}
                >
                  <Text style={[styles.iconBtnText, { color: colors.text }]}>Next</Text>
                </Pressable>
                <Pressable
                  onPress={() => setActive('report')}
                  style={[styles.iconBtn, { borderColor: colors.dangerBg }]}
                >
                  <Text style={[styles.iconBtnText, { color: colors.dangerBg }]}>Report</Text>
                </Pressable>
              </>
            )}
            {status !== 'idle' && (
              <Pressable
                onPress={() => setActive('end')}
                style={[styles.iconBtn, { backgroundColor: colors.dangerBg, borderColor: colors.dangerBg }]}
              >
                <Text style={[styles.iconBtnText, { color: 'white' }]}>End</Text>
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>

      <SettingsDialog
        open={active === 'settings'}
        onClose={() => setActive(null)}
      />

      <ConfirmDialog
        open={active === 'next'}
        title="Skip to next?"
        description="You'll leave the current chat and find a new match."
        confirmLabel="Next"
        onConfirm={() => {
          setActive(null)
          next()
        }}
        onCancel={() => setActive(null)}
      />
      <ConfirmDialog
        open={active === 'report'}
        title="Report this chat?"
        description="This will end the current chat and remove you from the room."
        confirmLabel="Report"
        tone="danger"
        onConfirm={() => {
          setActive(null)
          leave()
        }}
        onCancel={() => setActive(null)}
      />
      <ConfirmDialog
        open={active === 'end'}
        title="End chat?"
        description="This will end the current chat."
        confirmLabel="End"
        tone="danger"
        onConfirm={() => {
          setActive(null)
          leave()
        }}
        onCancel={() => setActive(null)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: { fontWeight: '600' },
  sub: {},
  iconBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  iconBtnText: { fontWeight: '600' },
})

