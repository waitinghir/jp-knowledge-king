import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addBattleResult } from '../../utils/storage';
import { playSound } from '../../utils/sound';
import { getLang, useStrings } from '../../utils/i18n';
import type { BattleResult, PlayerData } from '../../types';

function getOutcomeConfig(s: ReturnType<typeof useStrings>) {
  return {
    win:  { emoji: '🏆', label: s.winTitle,  color: '#F1C40F', sub: s.winSub  },
    lose: { emoji: '😤', label: s.loseTitle, color: '#E74C3C', sub: s.loseSub },
    draw: { emoji: '🤝', label: s.drawTitle, color: '#3498DB', sub: s.drawSub },
  };
}

export default function ResultScreen() {
  const router = useRouter();
  const s = useStrings();
  const lang = getLang();
  const params = useLocalSearchParams<{ result: string }>();
  const [updatedPlayer, setUpdatedPlayer] = useState<PlayerData | null>(null);

  const result: BattleResult = params.result
    ? (JSON.parse(params.result) as BattleResult)
    : {
        outcome: 'draw',
        playerTotalScore: 0,
        aiTotalScore: 0,
        questions: [],
        playerAnswers: [],
        aiAnswers: [],
        opponent: { name: '對手', level: 1, avatarColor: '#3498DB' },
      };

  const config = getOutcomeConfig(s)[result.outcome];

  // Entrance animation
  const headerScale = useRef(new Animated.Value(0.5)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const bodyOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Save result to AsyncStorage
    addBattleResult(result.playerTotalScore, result.outcome).then(setUpdatedPlayer);

    // Play outcome sound (slight delay to let animation start)
    const delay = result.outcome === 'win' ? 300 : 200;
    setTimeout(() => {
      if (result.outcome === 'win') playSound('win');
      else if (result.outcome === 'lose') playSound('lose');
    }, delay);

    // Animate header in
    Animated.sequence([
      Animated.parallel([
        Animated.spring(headerScale, { toValue: 1, useNativeDriver: true }),
        Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(bodyOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>

        {/* Outcome header */}
        <Animated.View
          style={[
            styles.outcomeCard,
            { borderColor: config.color, opacity: headerOpacity, transform: [{ scale: headerScale }] },
          ]}
        >
          <Text style={styles.outcomeEmoji}>{config.emoji}</Text>
          <Text style={[styles.outcomeLabel, { color: config.color }]}>{config.label}</Text>
          <Text style={styles.outcomeSub}>{config.sub}</Text>
        </Animated.View>

        <Animated.View style={[styles.body, { opacity: bodyOpacity }]}>

          {/* Score comparison */}
          <View style={styles.scoreRow}>
            <View style={styles.scoreBlock}>
              <Text style={styles.scoreName}>{s.you}</Text>
              <Text style={[styles.scoreNum, { color: '#C41E3A' }]}>{result.playerTotalScore}</Text>
            </View>
            <Text style={styles.scoreVs}>VS</Text>
            <View style={styles.scoreBlock}>
              <Text style={styles.scoreName}>{result.opponent.name}</Text>
              <Text style={[styles.scoreNum, { color: result.opponent.avatarColor }]}>
                {result.aiTotalScore}
              </Text>
            </View>
          </View>

          {/* Cumulative score update */}
          {updatedPlayer && (
            <View style={styles.cumulativeCard}>
              <Text style={styles.cumulativeLabel}>{s.thisRound(result.playerTotalScore)}</Text>
              <Text style={styles.cumulativeTotal}>
                {s.cumulative(updatedPlayer.totalScore, updatedPlayer.level)}
              </Text>
            </View>
          )}

          {/* Per-question breakdown */}
          <Text style={styles.sectionTitle}>{s.questionDetails}</Text>
          {result.questions.map((q, i) => {
            const pa = result.playerAnswers[i];
            const aa = result.aiAnswers[i];
            const playerSelected = pa?.selectedIndex !== null && pa?.selectedIndex !== undefined
              ? q.options[pa.selectedIndex]
              : s.timeout;
            const aiSelected = aa?.selectedIndex !== null && aa?.selectedIndex !== undefined
              ? q.options[aa.selectedIndex]
              : s.timeout;

            return (
              <View key={q.word.id} style={styles.questionRow}>
                {/* Question header */}
                <View style={styles.qHeader}>
                  <Text style={styles.qNum}>Q{i + 1}</Text>
                  <Text style={styles.qWord}>{q.word.kanji}</Text>
                  <Text style={styles.qAnswer}>→ {lang === 'en' ? q.word.meaning_en : q.word.meaning_zh}</Text>
                </View>

                {/* Player vs AI */}
                <View style={styles.qComparison}>
                  <View style={styles.qSide}>
                    <Text style={styles.qSideLabel}>{s.you}</Text>
                    <Text
                      style={[
                        styles.qChoice,
                        { color: pa?.isCorrect ? '#27AE60' : '#E74C3C' },
                      ]}
                    >
                      {pa?.isCorrect ? '✓' : '✗'} {playerSelected}
                    </Text>
                    <Text style={styles.qTime}>
                      {pa?.timeUsed === 10 ? s.timeout : `${pa?.timeUsed.toFixed(1)}s`}
                      {pa && pa.score > 0 ? ` · +${pa.score}` : ''}
                    </Text>
                  </View>

                  <View style={styles.qDivider} />

                  <View style={styles.qSide}>
                    <Text style={styles.qSideLabel}>{result.opponent.name}</Text>
                    <Text
                      style={[
                        styles.qChoice,
                        { color: aa?.isCorrect ? '#27AE60' : '#E74C3C' },
                      ]}
                    >
                      {aa?.isCorrect ? '✓' : '✗'} {aiSelected}
                    </Text>
                    <Text style={styles.qTime}>
                      {aa?.timeUsed === 10 ? s.timeout : `${aa?.timeUsed.toFixed(1)}s`}
                      {aa && aa.score > 0 ? ` · +${aa.score}` : ''}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}

          {/* Action buttons */}
          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPressed]}
              onPress={() => router.replace('/battle/matching')}
            >
              <Text style={styles.btnPrimaryText}>{s.playAgain}</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.btnSecondary, pressed && styles.btnPressed]}
              onPress={() => router.replace('/')}
            >
              <Text style={styles.btnSecondaryText}>{s.goHome}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#2C3E50' },
  container: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 20,
  },

  // Outcome card
  outcomeCard: {
    marginTop: 28,
    alignItems: 'center',
    backgroundColor: '#34495E',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    borderWidth: 2,
    gap: 8,
  },
  outcomeEmoji: { fontSize: 56 },
  outcomeLabel: { fontSize: 42, fontWeight: '900' },
  outcomeSub: { fontSize: 15, color: '#BDC3C7', textAlign: 'center' },

  body: { width: '100%', gap: 16 },

  // Score comparison
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34495E',
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-around',
  },
  scoreBlock: { alignItems: 'center', gap: 4 },
  scoreName: { fontSize: 14, color: '#BDC3C7' },
  scoreNum: { fontSize: 36, fontWeight: '900' },
  scoreVs: { fontSize: 20, color: '#7F8C8D', fontWeight: 'bold' },

  // Cumulative card
  cumulativeCard: {
    backgroundColor: '#1A252F',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  cumulativeLabel: { fontSize: 16, color: '#C41E3A', fontWeight: 'bold' },
  cumulativeTotal: { fontSize: 14, color: '#BDC3C7' },

  // Per-question
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7F8C8D',
    letterSpacing: 1,
    alignSelf: 'flex-start',
    marginBottom: -8,
  },
  questionRow: {
    backgroundColor: '#34495E',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  qHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#4A6278',
    paddingBottom: 8,
  },
  qNum: { fontSize: 12, color: '#7F8C8D', width: 24 },
  qWord: { fontSize: 18, fontWeight: 'bold', color: '#fff', flex: 1 },
  qAnswer: { fontSize: 13, color: '#BDC3C7' },

  qComparison: { flexDirection: 'row', alignItems: 'flex-start' },
  qSide: { flex: 1, alignItems: 'center', gap: 4 },
  qSideLabel: { fontSize: 12, color: '#95A5A6' },
  qChoice: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  qTime: { fontSize: 12, color: '#7F8C8D' },
  qDivider: { width: 1, backgroundColor: '#4A6278', marginHorizontal: 8, height: '100%' },

  // Buttons
  buttonRow: { gap: 12, marginTop: 8 },
  btnPrimary: {
    backgroundColor: '#C41E3A',
    paddingVertical: 18,
    borderRadius: 50,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#C41E3A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  btnPrimaryText: { fontSize: 20, fontWeight: '900', color: '#fff' },
  btnSecondary: {
    backgroundColor: '#34495E',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A6278',
  },
  btnSecondaryText: { fontSize: 18, fontWeight: '700', color: '#BDC3C7' },
  btnPressed: { opacity: 0.75 },
});
