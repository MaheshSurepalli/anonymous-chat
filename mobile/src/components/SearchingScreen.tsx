import React from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useTheme } from '../state/ThemeContext'

export default function SearchingScreen() {
  const { colors } = useTheme()
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ActivityIndicator />
      <Text style={[styles.text, { color: colors.muted }]}>Searching…</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  text: {},
})
