import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import FeedbackForm from '../components/FeedbackForm';
import { useStrings } from '../utils/i18n';

type ReminderTime = 'noon' | 'night';

// 1.8.0 UI mock: reminder switches hold local state only; nothing is saved or scheduled yet.
export default function SettingsScreen() {
  const router = useRouter();
  const s = useStrings();
  const [reminder, setReminder] = useState(true);
  const [times, setTimes] = useState<ReminderTime[]>(['night']);

  const toggleTime = (t: ReminderTime) =>
    setTimes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <Text style={styles.title}>{s.settingsTitle}</Text>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text style={styles.close}>{s.close}</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>{s.settingsReminder}</Text>
              <Switch value={reminder} onValueChange={setReminder} trackColor={{ true: '#C41E3A' }} />
            </View>
            {reminder && (
              <View style={styles.rowColumn}>
                <Text style={styles.subLabel}>{s.settingsReminderTime}</Text>
                <View style={styles.chips}>
                  {(['noon', 'night'] as const).map((t) => {
                    const on = times.includes(t);
                    return (
                      <Pressable key={t} style={[styles.chip, on && styles.chipOn]} onPress={() => toggleTime(t)}>
                        <Text style={[styles.chipText, on && styles.chipTextOn]}>
                          {on ? '✓ ' : ''}{t === 'noon' ? s.reminderNoon : s.reminderNight}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={styles.note}>{s.settingsReminderNote}</Text>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>{s.settingsFeedback}</Text>
            <FeedbackForm s={s} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#2C3E50' },
  container: { padding: 24, gap: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '900', color: '#fff' },
  close: { fontSize: 15, color: '#95A5A6' },
  card: { backgroundColor: '#34495E', borderRadius: 16, padding: 18, gap: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowColumn: { gap: 10 },
  label: { fontSize: 16, color: '#fff' },
  subLabel: { fontSize: 13, color: '#95A5A6' },
  note: { fontSize: 12, color: '#7F8C8D' },
  chips: { flexDirection: 'row', gap: 10 },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A6278',
  },
  chipOn: { backgroundColor: '#C41E3A', borderColor: '#C41E3A' },
  chipText: { fontSize: 14, color: '#95A5A6', fontWeight: '600' },
  chipTextOn: { color: '#fff' },
});
