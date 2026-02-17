import React from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useTheme } from '../state/ThemeContext'

export default function SearchingScreen() {
  const { colors } = useTheme()
  const [text, setText] = React.useState('Connecting to someone interesting…')

  React.useEffect(() => {
    const texts = [
      'Connecting to someone interesting…',
      'Scanning for vibes…',
      'Almost there…',
      'Finding a match…',
      'Checking compatibility…',
    ]
    let i = 0
    const interval = setInterval(() => {
      i = (i + 1) % texts.length
      setText(texts[i])
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ActivityIndicator size="large" color={colors.primaryBg} />
      <Text style={[styles.text, { color: colors.muted }]}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  text: {},
})
