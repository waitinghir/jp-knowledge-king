import { useCallback, useEffect, useRef } from 'react';
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
import { loadPlayerData } from '../../utils/storage';
import { INITIAL_PLAYER_DATA, SCORE_PER_LEVEL } from '../../types';
import { useState } from 'react';
import type { PlayerData } from '../../types';

export default function HomeScreen() {
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerData>(INITIAL_PLAYER_DATA);

  // Reload player data every time the screen comes into focus (e.g. after battle)
  useFocusEffect(
    useCallback(() => {
      loadPlayerData().then(setPlayer);
    }, [])
  );

  // Score progress within current level (0.0 – 1.0)
  const scoreInLevel = player.totalScore % SCORE_PER_LEVEL;
  const levelProgress = scoreInLevel / SCORE_PER_LEVEL;

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
          <Text style={styles.appName}>日文知識王</Text>
          <Text style={styles.tagline}>對戰學日文 · JLPT N4</Text>
        </View>

        {/* Player stats card */}
        <View style={styles.card}>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>等級</Text>
              <Text style={styles.statValue}>Lv.{player.level}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>總分</Text>
              <Text style={styles.statValue}>{player.totalScore}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statLabel}>勝場</Text>
              <Text style={styles.statValue}>{player.wins}</Text>
            </View>
          </View>

          {/* Level progress bar */}
          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round(levelProgress * 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            升級還差 {SCORE_PER_LEVEL - scoreInLevel} 分
          </Text>
        </View>

        {/* Start button */}
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              pressed && styles.startButtonPressed,
            ]}
            onPress={() => router.push('/battle/matching')}
          >
            <Text style={styles.startButtonText}>⚔️ 開始對戰</Text>
          </Pressable>
        </Animated.View>

        {/* Stats footer */}
        {player.gamesPlayed > 0 && (
          <Text style={styles.footer}>
            已對戰 {player.gamesPlayed} 場 · 勝率{' '}
            {Math.round((player.wins / player.gamesPlayed) * 100)}%
          </Text>
        )}
      </View>
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
});
