import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useStrings } from '../utils/i18n';

// 1.8.0 UI mock: switches hold local state only; nothing is saved or scheduled yet.
export default function SettingsScreen() {
  const router = useRouter();
  const s = useStrings();
  const [reminder, setReminder] = useState(true);
  const [time, setTime] = useState<'noon' | 'night'>('night');
  const [sound, setSound] = useState(true);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
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
              <View style={styles.segment}>
                {(['noon', 'night'] as const).map((t) => (
                  <Pressable
                    key={t}
                    style={[styles.segmentBtn, time === t && styles.segmentActive]}
                    onPress={() => setTime(t)}
                  >
                    <Text style={[styles.segmentText, time === t && styles.segmentTextActive]}>
                      {t === 'noon' ? s.reminderNoon : s.reminderNight}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>{s.settingsSound}</Text>
            <Switch value={sound} onValueChange={setSound} trackColor={{ true: '#C41E3A' }} />
          </View>
          <Text style={styles.note}>{s.settingsSoundNote}</Text>
        </View>

        <Pressable style={styles.card} onPress={() => router.push('/feedback')}>
          <View style={styles.row}>
            <Text style={styles.label}>{s.settingsFeedback}</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
        </Pressable>
      </View>
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
  chevron: { fontSize: 22, color: '#7F8C8D' },
  segment: { flexDirection: 'row', backgroundColor: '#2C3E50', borderRadius: 10, padding: 3, gap: 3 },
  segmentBtn: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  segmentActive: { backgroundColor: '#C41E3A' },
  segmentText: { fontSize: 14, color: '#95A5A6', fontWeight: '600' },
  segmentTextActive: { color: '#fff' },
});
