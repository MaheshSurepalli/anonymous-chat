import React from 'react'
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native'
import { useTheme } from '../state/ThemeContext'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { colors } = useTheme()
  const confirmStyle = tone === 'danger' ? { backgroundColor: colors.dangerBg } : { backgroundColor: colors.primaryBg }
  return (
    <Modal transparent visible={open} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {!!description && <Text style={[styles.desc, { color: colors.muted }]}>{description}</Text>}
          <View style={styles.row}>
            <Pressable onPress={onCancel} style={[styles.btnOutline, { borderColor: colors.border }]}>
              <Text style={{ color: colors.text }}>{cancelLabel}</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={[styles.btn, confirmStyle]}>
              <Text style={[styles.btnText, { color: colors.primaryText }]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 360, borderRadius: 16, padding: 16 },
  title: { fontSize: 18, fontWeight: '600' },
  desc: { marginTop: 6 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  btnOutline: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  btnText: { fontWeight: '600' },
})
