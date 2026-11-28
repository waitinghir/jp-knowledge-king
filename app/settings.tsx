import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
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
import {
  loadReminderSettings,
  requestReminderPermission,
  saveReminderSettings,
  formatTime,
  isPreset,
  timeOf,
  type ReminderSettings,
  type ReminderTime,
} from '../utils/reminders';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SettingsScreen() {
  const router = useRouter();
  const s = useStrings();
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  useEffect(() => { loadReminderSettings().then(setSettings); }, []);

  const update = (next: ReminderSettings) => {
    setSettings(next);
    saveReminderSettings(next);
  };

  const setReminder = async (on: boolean) => {
    if (!settings) return;
    if (!on) return update({ ...settings, enabled: false });
    // Turning it on: the iOS dialog appears here if it was never shown.
    const granted = await requestReminderPermission();
    if (!granted) {
      Alert.alert(s.reminderDeniedTitle, s.reminderDeniedBody, [
        { text: s.close, style: 'cancel' },
        { text: s.openSettings, onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    update({ ...settings, enabled: true, ask: 'answered', times: settings.times.length ? settings.times : ['night'] });
  };

  const toggleTime = (t: ReminderTime) => {
    if (!settings) return;
    const times = settings.times.includes(t) ? settings.times.filter((x) => x !== t) : [...settings.times, t];
    // Unticking both times turns reminders off.
    update({ ...settings, times, enabled: times.length > 0 });
  };

  // 1.8.3: one custom time ("HH:MM") besides the two presets
  const [picking, setPicking] = useState(false);
  const [pickTime, setPickTime] = useState(() => new Date(2000, 0, 1, 20, 0));
  const custom = settings?.times.find((t) => !isPreset(t));
  const openPicker = () => {
    const hm = custom ? timeOf(custom) : null;
    setPickTime(new Date(2000, 0, 1, hm?.hour ?? 20, hm?.minute ?? 0));
    setPicking(true);
  };
  const setCustom = (t: ReminderTime | null) => {
    if (!settings) return;
    const times = [...settings.times.filter(isPreset), ...(t ? [t] : [])];
    update({ ...settings, times, enabled: times.length > 0 });
    setPicking(false);
  };

  const reminder = !!settings?.enabled;
  const times = settings?.times ?? [];

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
                        <Text style={[styles.chipText, on && styles.chipTextOn]} numberOfLines={1} adjustsFontSizeToFit>
                          {on ? '✓ ' : ''}{t === 'noon' ? s.reminderNoonShort : s.reminderNightShort}
                        </Text>
                      </Pressable>
                    );
                  })}
                  <Pressable style={[styles.chip, !!custom && styles.chipOn]} onPress={openPicker}>
                    <Text style={[styles.chipText, !!custom && styles.chipTextOn]} numberOfLines={1} adjustsFontSizeToFit>
                      {custom ? `✓ ${custom}` : s.reminderCustom}
                    </Text>
                  </Pressable>
                </View>
                {picking && (
                  <View style={styles.pickerBox}>
                    <DateTimePicker
                      value={pickTime}
                      mode="time"
                      display="spinner"
                      minuteInterval={5}
                      themeVariant="dark"
                      onChange={(_, d) => d && setPickTime(d)}
                    />
                    <View style={styles.chips}>
                      {custom && (
                        <Pressable style={styles.chip} onPress={() => setCustom(null)}>
                          <Text style={styles.chipText}>{s.reminderRemove}</Text>
                        </Pressable>
                      )}
                      <Pressable
                        style={[styles.chip, styles.chipOn]}
                        onPress={() => setCustom(formatTime(pickTime.getHours(), pickTime.getMinutes()))}
                      >
                        <Text style={[styles.chipText, styles.chipTextOn]}>
                          {s.reminderUseTime} {formatTime(pickTime.getHours(), pickTime.getMinutes())}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}
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
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4A6278',
  },
  chipOn: { backgroundColor: '#C41E3A', borderColor: '#C41E3A' },
  chipText: { fontSize: 14, color: '#95A5A6', fontWeight: '600', textAlign: 'center' },
  chipTextOn: { color: '#fff' },
  pickerBox: { gap: 8 },
});
