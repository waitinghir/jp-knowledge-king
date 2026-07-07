import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../utils/supabase';
import { useStrings } from '../utils/i18n';

export default function FeedbackScreen() {
  const router = useRouter();
  const s = useStrings();
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
  }

  // ── Success state ─────────────────────────────────────────
  if (sent) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <View style={styles.checkCircle}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
          <Text style={styles.thanksTitle}>{s.feedbackThanksTitle}</Text>
          <Text style={styles.thanksSub}>{s.feedbackThanksSub}</Text>
          <Pressable style={styles.homeBtn} onPress={() => router.back()}>
            <Text style={styles.homeBtnText}>{s.feedbackBackHome}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Form ──────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.backArrow}>←</Text>
          </Pressable>
          <Text style={styles.title}>{s.feedbackTitle}</Text>
        </View>
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
          <Text style={styles.submitBtnText}>
            {sending ? '…' : s.feedbackSubmit}
          </Text>
        </Pressable>
        <Text style={styles.privacyHint}>{s.feedbackPrivacyHint}</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#2C3E50' },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backArrow: { fontSize: 24, color: '#95A5A6' },
  title: { fontSize: 22, fontWeight: '900', color: '#fff' },
  subtitle: { fontSize: 13, color: '#7F8C8D', marginTop: 8, marginBottom: 16 },

  messageInput: {
    backgroundColor: '#34495E',
    borderRadius: 12,
    padding: 14,
    height: 160,
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
  contactLabel: { fontSize: 12, color: '#7F8C8D', marginTop: 16, marginBottom: 6 },
  contactInput: {
    backgroundColor: '#34495E',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
  },

  submitBtn: {
    backgroundColor: '#C41E3A',
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontSize: 17, fontWeight: '700', color: '#fff' },
  privacyHint: { fontSize: 11, color: '#566573', textAlign: 'center', marginTop: 10 },

  // Success state
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1D9E75',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  checkMark: { fontSize: 36, color: '#fff', fontWeight: 'bold' },
  thanksTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  thanksSub: { fontSize: 13, color: '#7F8C8D', marginBottom: 24 },
  homeBtn: {
    borderWidth: 1,
    borderColor: '#7F8C8D',
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 36,
  },
  homeBtnText: { fontSize: 15, color: '#BDC3C7' },
});
