import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { Strings } from '../utils/i18n';

export type ReminderChoice = 'noon' | 'night' | 'later';

interface Props {
  visible: boolean;
  onChoose: (choice: ReminderChoice) => void;
  s: Strings;
}

/**
 * Our own ask before the iOS permission dialog: that dialog can only be shown
 * once per install, so it is triggered only after the player picks a time.
 */
export default function ReminderAsk({ visible, onChoose, s }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => onChoose('later')}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.icon}>⏰</Text>
          <Text style={styles.title}>{s.reminderAskTitle}</Text>
          <Text style={styles.sub}>{s.reminderAskSub}</Text>
          <Pressable style={styles.primary} onPress={() => onChoose('noon')}>
            <Text style={styles.primaryText}>{s.reminderNoon}</Text>
          </Pressable>
          <Pressable style={styles.primary} onPress={() => onChoose('night')}>
            <Text style={styles.primaryText}>{s.reminderNight}</Text>
          </Pressable>
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
  later: { color: '#95A5A6', fontSize: 14, textAlign: 'center', marginTop: 6 },
});
