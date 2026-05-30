import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { loadPlayerData } from '../../utils/storage';
import { getWeekId, getOrCreateLeaderboardState, buildLeaderboard } from '../../utils/leaderboard';
import { useStrings } from '../../utils/i18n';
import type { LeaderboardEntry } from '../../types';

const MEDAL = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen() {
  const s = useStrings();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPlayed, setHasPlayed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        setLoading(true);
        const player = await loadPlayerData();
        const weekId = getWeekId();

        // New week detection: weeklyScore resets
        const isThisWeek = player.currentWeekId === weekId;
        const weeklyScore = isThisWeek ? player.weeklyScore : 0;

        if (weeklyScore === 0) {
          if (!cancelled) { setHasPlayed(false); setLoading(false); }
          return;
        }

        const state = await getOrCreateLeaderboardState(weekId, weeklyScore);
        const ranked = buildLeaderboard(state, weeklyScore);
        if (!cancelled) {
          setEntries(ranked);
          setHasPlayed(true);
          setLoading(false);
        }
      }

      load();
      return () => { cancelled = true; };
    }, [])
  );

  // ── Render ────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color="#C41E3A" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!hasPlayed) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>{s.leaderboardTitle}</Text>
          <Text style={styles.subtitle}>{s.leaderboardSubtitle}</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.calcIcon}>⏳</Text>
          <Text style={styles.calcTitle}>{s.leaderboardCalculating}</Text>
          <Text style={styles.calcHint}>{s.leaderboardCalculatingHint}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>{s.leaderboardTitle}</Text>
        <Text style={styles.subtitle}>{s.leaderboardSubtitle}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} bounces={false}>

        {/* Podium */}
        <View style={styles.podium}>
          {/* rank 2 */}
          <View style={[styles.podiumItem, styles.p2]}>
            <View style={[styles.podiumAvatar, { backgroundColor: top3[1]?.avatarColor }]}>
              <Text style={styles.podiumAvatarText}>{top3[1]?.name[0]}</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{top3[1]?.name}</Text>
            <Text style={styles.podiumScore}>{top3[1]?.score}</Text>
            <View style={[styles.podiumBlock, styles.podiumBlock2]}>
              <Text style={styles.podiumMedal}>🥈</Text>
            </View>
          </View>

          {/* rank 1 */}
          <View style={[styles.podiumItem, styles.p1]}>
            <Text style={styles.crown}>👑</Text>
            <View style={[styles.podiumAvatar, styles.podiumAvatarLarge, { backgroundColor: top3[0]?.avatarColor }]}>
              <Text style={[styles.podiumAvatarText, styles.podiumAvatarTextLarge]}>{top3[0]?.name[0]}</Text>
            </View>
            <Text style={[styles.podiumName, styles.podiumNameLarge]} numberOfLines={1}>{top3[0]?.name}</Text>
            <Text style={[styles.podiumScore, styles.podiumScoreLarge]}>{top3[0]?.score}</Text>
            <View style={[styles.podiumBlock, styles.podiumBlock1]}>
              <Text style={styles.podiumMedal}>🥇</Text>
            </View>
          </View>

          {/* rank 3 */}
          <View style={[styles.podiumItem, styles.p3]}>
            <View style={[styles.podiumAvatar, { backgroundColor: top3[2]?.avatarColor }]}>
              <Text style={styles.podiumAvatarText}>{top3[2]?.name[0]}</Text>
            </View>
            <Text style={styles.podiumName} numberOfLines={1}>{top3[2]?.name}</Text>
            <Text style={styles.podiumScore}>{top3[2]?.score}</Text>
            <View style={[styles.podiumBlock, styles.podiumBlock3]}>
              <Text style={styles.podiumMedal}>🥉</Text>
            </View>
          </View>
        </View>

        {/* Ranks 4–10 */}
        <View style={styles.list}>
          {rest.map((entry, i) => (
            <View
              key={entry.id}
              style={[styles.row, entry.isPlayer && styles.rowPlayer]}
            >
              <Text style={[styles.rank, entry.isPlayer && styles.rankPlayer]}>
                {i + 4}
              </Text>
              <View style={[styles.avatar, { backgroundColor: entry.avatarColor }]}>
                <Text style={styles.avatarText}>{entry.name[0]}</Text>
              </View>
              <Text style={[styles.name, entry.isPlayer && styles.namePlayer]} numberOfLines={1}>
                {entry.name}
                {entry.isPlayer && <Text style={styles.meBadge}> ME</Text>}
              </Text>
              <Text style={[styles.score, entry.isPlayer && styles.scorePlayer]}>
                {entry.score}
              </Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#2C3E50' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },

  // Header
  header: { alignItems: 'center', paddingTop: 16, paddingBottom: 8, gap: 4 },
  title: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  subtitle: { fontSize: 12, color: '#7F8C8D' },

  // Calculating state
  calcIcon: { fontSize: 48 },
  calcTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  calcHint: { fontSize: 13, color: '#7F8C8D', textAlign: 'center', lineHeight: 20 },

  // Podium
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  podiumItem: { alignItems: 'center', flex: 1, gap: 4 },
  p1: { marginBottom: 0 },
  p2: { marginBottom: 0 },
  p3: { marginBottom: 0 },

  crown: { fontSize: 20 },

  podiumAvatar: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  podiumAvatarLarge: { width: 56, height: 56, borderRadius: 28 },
  podiumAvatarText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  podiumAvatarTextLarge: { fontSize: 22 },

  podiumName: { fontSize: 11, color: '#BDC3C7', textAlign: 'center' },
  podiumNameLarge: { fontSize: 13, color: '#fff', fontWeight: '700' },
  podiumScore: { fontSize: 13, fontWeight: 'bold', color: '#F39C12' },
  podiumScoreLarge: { fontSize: 16 },

  podiumBlock: {
    width: '100%', borderRadius: 6,
    alignItems: 'center', justifyContent: 'center', paddingVertical: 6,
  },
  podiumBlock1: { height: 56, backgroundColor: '#F39C12' },
  podiumBlock2: { height: 44, backgroundColor: '#95A5A6' },
  podiumBlock3: { height: 34, backgroundColor: '#CD7F32' },
  podiumMedal: { fontSize: 20 },

  // List
  body: { paddingHorizontal: 16, paddingBottom: 24, gap: 16 },
  list: { gap: 6 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#34495E', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 14,
  },
  rowPlayer: {
    backgroundColor: '#4A1020',
    borderWidth: 1, borderColor: '#C41E3A',
  },

  rank: { fontSize: 13, fontWeight: 'bold', color: '#7F8C8D', width: 20, textAlign: 'center' },
  rankPlayer: { color: '#C41E3A' },

  avatar: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: 'bold', color: '#fff' },

  name: { flex: 1, fontSize: 14, color: '#fff' },
  namePlayer: { fontWeight: '700' },
  meBadge: { fontSize: 10, color: '#C41E3A', fontWeight: '900' },

  score: { fontSize: 14, fontWeight: 'bold', color: '#F39C12' },
  scorePlayer: { color: '#C41E3A' },
});
