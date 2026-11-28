import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import type { Strings } from '../utils/i18n';
import { formatTime } from '../utils/reminders';

/** 'noon' / 'night' presets, a picked time as "HH:MM", or 'later'. */
export type ReminderChoice = 'noon' | 'night' | 'later' | string;

interface Props {
  visible: boolean;
  onChoose: (choice: ReminderChoice) => void;
  s: Strings;
}

/**
 * Our own ask before the iOS permission dialog: that dialog can only be shown
 * once per install, so it is triggered only after the player picks a time.
 * 1.8.3: two quick presets plus "pick another time" (an iOS time wheel shown
 * inside the card), for players whose day doesn't fit 12:30 or 22:30.
 */
export default function ReminderAsk({ visible, onChoose, s }: Props) {
  const [picking, setPicking] = useState(false);
  const [time, setTime] = useState(() => new Date(2000, 0, 1, 20, 0));
  useEffect(() => {
    if (!visible) setPicking(false);
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => onChoose('later')}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.icon}>⏰</Text>
          <Text style={styles.title}>{s.reminderAskTitle}</Text>
          <Text style={styles.sub}>{s.reminderAskSub}</Text>
          {picking ? (
            <>
              <DateTimePicker
                value={time}
                mode="time"
                display="spinner"
                minuteInterval={5}
                themeVariant="dark"
                onChange={(_, d) => d && setTime(d)}
              />
              <Pressable
                style={styles.primary}
                onPress={() => onChoose(formatTime(time.getHours(), time.getMinutes()))}
              >
                <Text style={styles.primaryText}>
                  {s.reminderUseTime} {formatTime(time.getHours(), time.getMinutes())}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable style={styles.primary} onPress={() => onChoose('noon')}>
                <Text style={styles.primaryText}>{s.reminderNoon}</Text>
              </Pressable>
              <Pressable style={styles.primary} onPress={() => onChoose('night')}>
                <Text style={styles.primaryText}>{s.reminderNight}</Text>
              </Pressable>
              <Pressable onPress={() => setPicking(true)} hitSlop={8}>
                <Text style={styles.other}>{s.reminderOther}</Text>
              </Pressable>
            </>
          )}
          <Pressable onPress={() => onChoose('later')} hitSlop={8}>
            <Text style={styles.later}>{s.reminderLater}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 32 },
  card: { backgroundColor: '#34495E', borderRadius: 20, padding: 24, gap: 12, alignItems: 'stretch' },
  icon: { fontSize: 40, textAlign: 'center' },
  title: { fontSize: 20, fontWeight: '900', color: '#fff', textAlign: 'center' },
  sub: { fontSize: 13, color: '#95A5A6', textAlign: 'center', marginBottom: 8 },
  primary: { backgroundColor: '#C41E3A', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  other: { color: '#5DADE2', fontSize: 15, fontWeight: '600', textAlign: 'center', marginTop: 2 },
  later: { color: '#95A5A6', fontSize: 14, textAlign: 'center', marginTop: 6 },
});
