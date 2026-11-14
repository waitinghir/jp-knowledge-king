import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { supabase } from '../utils/supabase';
import type { Strings } from '../utils/i18n';

/** Feedback form shown inline on the settings screen. */
export default function FeedbackForm({ s }: { s: Strings }) {
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const canSubmit = message.trim().length > 0 && !sending;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSending(true);
    const { error } = await supabase.from('feedback').insert({
      message: message.trim(),
      contact: contact.trim() || null,
    });
    setSending(false);
    if (error) {
      Alert.alert('', s.feedbackError);
      return;
    }
    setSent(true);
    setMessage('');
    setContact('');
  }

  if (sent) {
    return (
      <View style={styles.thanks}>
        <Text style={styles.thanksTitle}>✓ {s.feedbackThanksTitle}</Text>
        <Text style={styles.thanksSub}>{s.feedbackThanksSub}</Text>
        <Pressable onPress={() => setSent(false)} hitSlop={8}>
          <Text style={styles.again}>{s.feedbackWriteAnother}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <Text style={styles.subtitle}>{s.feedbackSubtitle}</Text>
      <TextInput
        style={styles.messageInput}
        value={message}
        onChangeText={setMessage}
        placeholder={s.feedbackPlaceholder}
        placeholderTextColor="#7F8C8D"
        multiline
        maxLength={2000}
        textAlignVertical="top"
      />
      <Text style={styles.contactLabel}>{s.feedbackContactLabel}</Text>
      <TextInput
        style={styles.contactInput}
        value={contact}
        onChangeText={setContact}
        placeholder={s.feedbackContactPlaceholder}
        placeholderTextColor="#7F8C8D"
        maxLength={200}
        autoCapitalize="none"
      />
      <Pressable
        style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit}
      >
        <Text style={styles.submitBtnText}>{sending ? '…' : s.feedbackSubmit}</Text>
      </Pressable>
      <Text style={styles.privacyHint}>{s.feedbackPrivacyHint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 10 },
  subtitle: { fontSize: 12, color: '#7F8C8D' },
  messageInput: {
    backgroundColor: '#2C3E50',
    borderRadius: 12,
    padding: 12,
    height: 110,
    color: '#fff',
    fontSize: 15,
    lineHeight: 21,
  },
  contactLabel: { fontSize: 12, color: '#7F8C8D', marginTop: 4 },
  contactInput: {
    backgroundColor: '#2C3E50',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
  },
  submitBtn: { backgroundColor: '#C41E3A', borderRadius: 50, paddingVertical: 12, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  privacyHint: { fontSize: 11, color: '#566573', textAlign: 'center' },
  thanks: { alignItems: 'center', gap: 6, paddingVertical: 8 },
  thanksTitle: { fontSize: 16, fontWeight: '700', color: '#2ECC71' },
  thanksSub: { fontSize: 12, color: '#7F8C8D' },
  again: { fontSize: 13, color: '#95A5A6', textDecorationLine: 'underline', marginTop: 4 },
});
