import React from 'react'
import { Modal, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native'
import { useTheme } from '../state/ThemeContext'
import { SafeAreaView } from 'react-native-safe-area-context'

type PrivacyPolicyModalProps = {
    open: boolean
    onClose: () => void
}

const POLICY_TEXT = `
Privacy Policy for Stranger Chat

Last updated: 11/14/2025

1. Introduction

Stranger Chat (“the App”) provides anonymous 1-to-1 chat between two users.
No registration, login, or personal identification is required to use the app.

This Privacy Policy explains what information is processed by the App and how it is handled.
We are committed to protecting your privacy and ensuring a safe experience.

2. Information We Do Not Collect

We do NOT collect, store, or require:

Name

Email address

Phone number

Contact list

Uploaded photos

Location (GPS or network)

Device identifiers

Advertising ID

Payments or financial data

You can use the App completely anonymously.

3. Information We Process Temporarily

The App uses a WebSocket-based communication system to connect two random users for real-time chat.

The following data is processed only in memory and NOT stored:

Randomly generated user ID (session-only)

Emoji avatar (session-only)

Messages exchanged between the two users (real-time only)

Typing indicators

Matchmaking status

Session timestamps

Connection/disconnection events

We do not store message history.
Messages disappear as soon as the session ends or the user leaves the chat.
Nothing is saved on the server or in any database.

4. Data Retention

We do not retain or save any personal data or chat messages.

Once the chat ends or a user disconnects:

The session is destroyed

All temporary data is removed from server memory

No logs contain message content or user identity

5. How We Use the Temporary Data

The temporary in-memory data is used only for:

Pairing two users

Delivering chat messages in real time

Showing typing indicators

Managing the conversation state

This data is never shared, sold, monetized, or permanently stored.

6. Third-Party Services

The App does not use:

Analytics services

Advertising platforms

User tracking

Social login

Crashlytics or error reporting tools that collect personal data

Only the WebSocket server (hosted on Azure or other cloud provider) is used for real-time communication.

7. Children’s Privacy

Because the App allows unmonitored user-generated content, it is not intended for children under 16.
We do not knowingly allow minors to use the App.

8. User-Generated Content & Safety

Because conversations are anonymous and temporary:

You should not share personal details

You should not send harmful, illegal, or inappropriate content

Misuse of the App may lead to access restriction

A “Report” option may be added to comply with Google Play policies for user safety.

9. Security

We use encrypted WebSocket (WSS) connections in production to protect communication between users.

Even though messages are not stored, transmission is secured during the session.

10. Changes to This Policy

We may update this Privacy Policy as needed.
The “Last updated” date will always indicate the newest version.

11. Contact

If you have questions about this Privacy Policy, contact:

Email: surepallimahesh8@gmail.com
`

export default function PrivacyPolicyModal({ open, onClose }: PrivacyPolicyModalProps) {
    const { colors } = useTheme()

    return (
        <Modal visible={open} animationType="slide" onRequestClose={onClose}>
            <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.title, { color: colors.text }]}>Privacy Policy</Text>
                    <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.muted + '20' }]}>
                        <Text style={{ color: colors.text }}>Close</Text>
                    </Pressable>
                </View>
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={[styles.text, { color: colors.text }]}>{POLICY_TEXT}</Text>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    title: { fontSize: 18, fontWeight: '600' },
    closeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    content: { padding: 16 },
    text: { fontSize: 16, lineHeight: 24 },
})
