import { useCallback, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { INITIAL_PLAYER_DATA, type PlayerData } from '../../types';
import { loadPlayerData } from '../../utils/storage';
import { useStrings } from '../../utils/i18n';
import FlameIcon from '../../components/FlameIcon';
import { MOCK_DAILY } from '../../utils/mockDaily';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function TodayScreen() {
  const s = useStrings();
  const [player, setPlayer] = useState<PlayerData>(INITIAL_PLAYER_DATA);
  useFocusEffect(useCallback(() => { loadPlayerData().then(setPlayer); }, []));
  const d = MOCK_DAILY;

  const missionLabel = (key: string) =>
    key === 'theme' ? s.missionThemeBattle : key === 'correct' ? s.missionCorrect(10) : s.missionFixMistake;

  // Current month calendar: leading blanks, then 1..days
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{s.dailyTitle}</Text>
        <Text style={styles.theme}>{s.todayTheme(s.themes[d.theme])}</Text>
        <View style={styles.streakRow}>
          <FlameIcon lit={d.playedToday} size={18} />
          <Text style={styles.streak}>{s.daysPracticed(d.daysPracticed)} · {s.streakDays(d.streak)}</Text>
        </View>

        <View style={styles.card}>
          {d.missions.map((m) => (
            <View key={m.key} style={styles.missionRow}>
              <View style={[styles.check, m.done && styles.checkDone]}>
                {m.done && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={[styles.missionText, m.done && styles.missionDone]}>{missionLabel(m.key)}</Text>
              {'progress' in m && !m.done && (
                <Text style={styles.missionProgress}>{m.progress}/{m.target}</Text>
              )}
            </View>
          ))}
          <Text style={styles.note}>{s.dailyNote}</Text>
        </View>

        <Pressable style={({ pressed }) => [styles.startButton, pressed && { opacity: 0.85 }]}>
          <Text style={styles.startText}>{s.startThemeBattle}</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.monthTitle}>{s.monthStamps(d.stampedDays.length)}</Text>
          <View style={styles.grid}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={styles.weekday}>{w}</Text>
            ))}
            {cells.map((day, i) => {
              const stamped = day !== null && d.stampedDays.includes(day);
              const today = day === now.getDate();
              return (
                <View key={i} style={styles.cell}>
                  {day !== null && (
                    <View style={[styles.dayCircle, stamped && styles.dayStamped, today && styles.dayToday]}>
                      <Text style={[styles.dayText, stamped && styles.dayTextStamped]}>{day}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
        {/* Battle record: moved here from the home screen */}
        {player.gamesPlayed > 0 && (
          <View style={styles.card}>
            <Text style={styles.monthTitle}>{s.battleRecord}</Text>
            <Text style={styles.record}>
              {s.battleStats(player.gamesPlayed, Math.round((player.wins / player.gamesPlayed) * 100))}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#2C3E50' },
  container: { padding: 24, paddingTop: 40, gap: 20 },
  title: { fontSize: 24, fontWeight: '900', color: '#fff' },
  theme: { fontSize: 15, color: '#F1C40F', fontWeight: '600' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: -10 },
  streak: { fontSize: 14, color: '#95A5A6' },
  card: { backgroundColor: '#34495E', borderRadius: 16, padding: 18, gap: 14 },
  missionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#7F8C8D',
    alignItems: 'center', justifyContent: 'center',
  },
  checkDone: { backgroundColor: '#27AE60', borderColor: '#27AE60' },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '900' },
  missionText: { flex: 1, fontSize: 16, color: '#fff' },
  missionDone: { color: '#7F8C8D', textDecorationLine: 'line-through' },
  missionProgress: { fontSize: 14, color: '#95A5A6' },
  note: { fontSize: 12, color: '#7F8C8D' },
  startButton: { backgroundColor: '#C41E3A', borderRadius: 50, paddingVertical: 16, alignItems: 'center' },
  startText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  monthTitle: { fontSize: 15, fontWeight: '600', color: '#fff' },
  record: { fontSize: 14, color: '#95A5A6' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: '14.28%', textAlign: 'center', fontSize: 11, color: '#7F8C8D', marginBottom: 6 },
  cell: { width: '14.28%', alignItems: 'center', marginVertical: 3 },
  dayCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayStamped: { backgroundColor: '#C41E3A' },
  dayToday: { borderWidth: 2, borderColor: '#F1C40F' },
  dayText: { fontSize: 13, color: '#95A5A6' },
  dayTextStamped: { color: '#fff', fontWeight: '700' },
});
