import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { DEFAULT_WORD_LEVEL, loadPlayerData, loadWordLevel, saveWordLevel } from '../../utils/storage';
import { onPlayerDataRestored } from '../../utils/cloudSync';
import { INITIAL_PLAYER_DATA } from '../../types';
import type { PlayerData, WordLevel } from '../../types';
import { useStrings } from '../../utils/i18n';
import LevelPicker from '../../components/LevelPicker';
import ReminderAsk from '../../components/ReminderAsk';
import { MOCK_DAILY } from '../../utils/mockDaily';

export default function HomeScreen() {
  const router = useRouter();
  const s = useStrings();
  const [player, setPlayer] = useState<PlayerData>(INITIAL_PLAYER_DATA);
  const [wordLevel, setWordLevel] = useState<WordLevel>(DEFAULT_WORD_LEVEL);
  // 1.8.0 mock: show the reminder ask once per launch so it can be reviewed
  const [askReminder, setAskReminder] = useState(false);

  // Three segments = today's three missions; label reads "今日 1/3 ›"
  const done = MOCK_DAILY.missions.filter((m) => m.done).length;
  const missionDots = (
    <View style={styles.dotsRow}>
      {MOCK_DAILY.missions.map((m, i) => (
        <View key={i} style={[styles.segment, m.done && styles.segmentDone]} />
      ))}
      <Text style={styles.dotsLabel}>{s.missionsProgress(done, MOCK_DAILY.missions.length)} ›</Text>
    </View>
  );

  // Reload player data every time the screen comes into focus (e.g. after battle)
  useFocusEffect(
    useCallback(() => {
      loadPlayerData().then(setPlayer);
      loadWordLevel().then(setWordLevel);
    }, [])
  );

  // P2: if the cloud copy had more progress, show it as soon as it's restored
  useEffect(() => onPlayerDataRestored(setPlayer), []);


  // Pulsing animation for the start button
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.04,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.flag}>🇯🇵</Text>
          <Text style={styles.appName}>{s.appName}</Text>
          <Text style={styles.tagline}>{s.appTagline}</Text>
        </View>

        {/* Today card: days, today's theme and missions (1.8.0 mock data) */}
          <Pressable style={styles.todayCard} onPress={() => router.push('/today')}>
          <View style={styles.todayRow}>
            <View style={styles.todayLeft}>
              {/* 🌱 never practised · faded flame = not yet today · lit flame = done today */}
              <Text style={[styles.todayFlame, MOCK_DAILY.daysPracticed > 0 && !MOCK_DAILY.playedToday && styles.flameUnlit]}>
                {MOCK_DAILY.daysPracticed === 0 ? '🌱' : '🔥'}
              </Text>
              <Text style={styles.todayDays}>{MOCK_DAILY.daysPracticed}</Text>
              <Text style={styles.todayDaysLabel}>{s.statDays}</Text>
            </View>
            <View style={styles.todayRight}>
              <Pressable style={styles.themeButton} onPress={() => router.push('/today')}>
                <Text style={styles.themeButtonText}>{s.themeBattle(s.themes[MOCK_DAILY.theme])} ›</Text>
              </Pressable>
              {missionDots}
            </View>
          </View>
          {/* Growth: level and words mastered, under a divider */}
          <View style={styles.todayDivider} />
          <Text style={styles.growth}>
            Lv.{player.level} · {s.wordsMastered(MOCK_DAILY.wordsMastered)}
          </Text>
          </Pressable>


        {/* Level picker: swipe along あ → ア → N5 … N2 → 生活 → 全部 */}
        <LevelPicker
          value={wordLevel}
          onChange={(lv) => {
            setWordLevel(lv);
            saveWordLevel(lv);
          }}
          s={s}
        />

        {/* Start button */}
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              pressed && styles.startButtonPressed,
            ]}
            onPress={() => router.push({ pathname: '/battle/matching', params: { wordLevel } })}
          >
            <Text style={styles.startButtonText}>{s.startBattle}</Text>
          </Pressable>
        </Animated.View>
      </View>

      {/* Settings (feedback moved in there) */}
      <Pressable style={styles.gear} onPress={() => router.push('/settings')} hitSlop={12}>
        <Text style={styles.gearText}>⚙︎</Text>
      </Pressable>

      <ReminderAsk visible={askReminder} onChoose={() => setAskReminder(false)} s={s} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#2C3E50',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 32,
  },

  // Header
  header: { alignItems: 'center', gap: 6 },
  flag: { fontSize: 56 },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    textAlign: 'center',
  },
  tagline: { fontSize: 14, color: '#95A5A6' },

  // Stats card
  card: {
    width: '100%',
    backgroundColor: '#34495E',
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  stat: { alignItems: 'center', gap: 4 },
  statLabel: { fontSize: 12, color: '#95A5A6' },
  statValue: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  statDivider: { width: 1, height: 36, backgroundColor: '#4A6278' },

  // Progress bar
  progressBg: {
    height: 8,
    backgroundColor: '#4A6278',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#C41E3A',
    borderRadius: 4,
  },
  progressLabel: { fontSize: 11, color: '#7F8C8D', textAlign: 'center' },


  // Start button
  startButton: {
    backgroundColor: '#C41E3A',
    paddingHorizontal: 52,
    paddingVertical: 20,
    borderRadius: 50,
    elevation: 6,
    shadowColor: '#C41E3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  startButtonPressed: { opacity: 0.85 },
  startButtonText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },

  // Footer
  footer: { fontSize: 13, color: '#7F8C8D' },

  // Today's progress (mock variants)
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  segment: { width: 28, height: 6, borderRadius: 3, backgroundColor: '#4A6278' },
  segmentDone: { backgroundColor: '#F1C40F' },
  dotsLabel: { fontSize: 12, color: '#95A5A6', marginLeft: 6 },
  todayCard: {
    width: '100%',
    backgroundColor: '#34495E',
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  todayLeft: { alignItems: 'center', width: 72 },
  todayFlame: { fontSize: 28 },
  flameUnlit: { opacity: 0.3 },
  todayDays: { fontSize: 30, fontWeight: '900', color: '#fff' },
  todayDaysLabel: { fontSize: 11, color: '#95A5A6' },
  todayRight: { flex: 1, gap: 10 },
  themeButton: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: '#F1C40F',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  themeButtonText: { fontSize: 14, fontWeight: '700', color: '#F1C40F' },
  growth: { fontSize: 13, color: '#95A5A6', textAlign: 'center' },
  todayRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  todayDivider: { height: 1, backgroundColor: '#4A6278' },

  // Settings
  gear: { position: 'absolute', top: 60, right: 24 },
  gearText: { fontSize: 26, color: '#95A5A6' },
});
