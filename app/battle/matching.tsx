import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { generateOpponent, randomDifficulty } from '../../utils/ai-opponent';
import { loadPlayerData } from '../../utils/storage';
import { useStrings } from '../../utils/i18n';
import type { AIOpponent } from '../../types';

// Phases: searching → found → (navigate)
type Phase = 'searching' | 'found';

const DOTS = ['', '.', '..', '...'];

export default function MatchingScreen() {
  const router = useRouter();
  const s = useStrings();
  const [phase, setPhase] = useState<Phase>('searching');
  const [opponent, setOpponent] = useState<AIOpponent | null>(null);
  const [dotIdx, setDotIdx] = useState(0);

  // Rotating dots animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.6)).current;

  // Spinning animation for the search indicator
  const spinAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, [spinAnim]);

  const spinInterp = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Animate dots
  useEffect(() => {
    const timer = setInterval(() => {
      setDotIdx((i) => (i + 1) % DOTS.length);
    }, 400);
    return () => clearInterval(timer);
  }, []);

  // Matching logic: 1.2s searching → show opponent → 1.2s → navigate
  useEffect(() => {
    let cancelled = false;

    async function runMatch() {
      const playerData = await loadPlayerData();
      const opp = generateOpponent(playerData.level);
      const difficulty = randomDifficulty();

      // Wait 1.2s to simulate "searching"
      await new Promise((r) => setTimeout(r, 1200));
      if (cancelled) return;

      setOpponent(opp);
      setPhase('found');

      // Fade-in animation for opponent card
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
      ]).start();

      // Wait 1.3s on "found" screen, then navigate
      await new Promise((r) => setTimeout(r, 1300));
      if (cancelled) return;

      router.replace({
        pathname: '/battle/play',
        params: {
          opponentName: opp.name,
          opponentLevel: String(opp.level),
          opponentColor: opp.avatarColor,
          difficulty: String(difficulty),
        },
      });
    }

    runMatch();
    return () => { cancelled = true; };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {phase === 'searching' && (
          <>
            <Animated.Text style={[styles.searchIcon, { transform: [{ rotate: spinInterp }] }]}>
              ⚔️
            </Animated.Text>
            <Text style={styles.title}>{s.searching(DOTS[dotIdx])}</Text>
            <Text style={styles.sub}>{s.matchingWait}</Text>
          </>
        )}

        {phase === 'found' && opponent && (
          <Animated.View
            style={[
              styles.foundCard,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            <Text style={styles.foundLabel}>{s.foundLabel}</Text>

            <View style={[styles.avatar, { backgroundColor: opponent.avatarColor }]}>
              <Text style={styles.avatarText}>{opponent.name[0]}</Text>
            </View>

            <Text style={styles.opponentName}>{opponent.name}</Text>
            <Text style={styles.opponentLevel}>Lv.{opponent.level}</Text>

            <View style={styles.vsRow}>
              <Text style={styles.vsText}>{s.readyLabel}</Text>
            </View>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#2C3E50' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },

  // Searching phase
  searchIcon: { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  sub: { fontSize: 14, color: '#95A5A6' },

  // Found phase
  foundCard: {
    alignItems: 'center',
    backgroundColor: '#34495E',
    borderRadius: 24,
    padding: 36,
    gap: 12,
    width: 260,
  },
  foundLabel: {
    fontSize: 16,
    color: '#C41E3A',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  avatarText: { fontSize: 36, color: '#fff', fontWeight: 'bold' },
  opponentName: { fontSize: 28, fontWeight: '900', color: '#fff' },
  opponentLevel: { fontSize: 16, color: '#95A5A6' },
  vsRow: {
    marginTop: 8,
    backgroundColor: '#C41E3A',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  vsText: { fontSize: 16, color: '#fff', fontWeight: 'bold' },
});
