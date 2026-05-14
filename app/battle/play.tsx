import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import Timer from '../../components/Timer';
import OptionButton from '../../components/OptionButton';
import ScoreBoard from '../../components/ScoreBoard';
import { generateQuestions } from '../../utils/question';
import { simulateAIAnswer } from '../../utils/ai-opponent';
import { calculateScore, determineBattleOutcome } from '../../utils/scoring';
import { loadPlayerData } from '../../utils/storage';
import { initSounds, playSound } from '../../utils/sound';
import { getLang, useStrings } from '../../utils/i18n';
import { loadWords } from '../../utils/wordBank';

import type { Word, Question, Answer, AIOpponent, BattleResult, WordLevel } from '../../types';
import type { OptionState } from '../../components/OptionButton';

const TOTAL_QUESTIONS = 5;
const QUESTION_DURATION = 10; // seconds
const FEEDBACK_DURATION = 1800; // ms to show feedback before next question

type QuestionPhase = 'answering' | 'feedback';

export default function PlayScreen() {
  const router = useRouter();
  const s = useStrings();
  const params = useLocalSearchParams<{
    opponentName: string;
    opponentLevel: string;
    opponentColor: string;
    difficulty: string;
    wordLevel: WordLevel;
  }>();

  const opponent: AIOpponent = {
    name: params.opponentName ?? '對手',
    level: parseInt(params.opponentLevel ?? '1', 10),
    avatarColor: params.opponentColor ?? '#3498DB',
  };
  const difficulty = parseFloat(params.difficulty ?? '0.8');
  const wordLevel: WordLevel = params.wordLevel ?? 'all';

  // ── State ─────────────────────────────────────────────────────────────────
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [phase, setPhase] = useState<QuestionPhase>('answering');

  const [playerAnswers, setPlayerAnswers] = useState<Answer[]>([]);
  const [aiAnswers, setAiAnswers] = useState<Answer[]>([]);

  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);

  const [optionStates, setOptionStates] = useState<OptionState[]>(['default', 'default', 'default', 'default']);
  const [aiChoiceIndex, setAiChoiceIndex] = useState<number | null>(null);

  const [playerLevel, setPlayerLevel] = useState(1);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

  // Word entrance animation
  const wordFade = useRef(new Animated.Value(0)).current;
  const wordSlide = useRef(new Animated.Value(20)).current;

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadPlayerData().then((d) => setPlayerLevel(d.level));
    loadWords().then((words) => {
      const filtered = wordLevel === 'all' ? words : words.filter((w) => w.level === wordLevel);
      setQuestions(generateQuestions(filtered, TOTAL_QUESTIONS, getLang()));
    });
    initSounds();
  }, []);

  // ── Start timer when question changes ────────────────────────────────────
  useEffect(() => {
    if (questions.length === 0) return;

    // Animate word in
    wordFade.setValue(0);
    wordSlide.setValue(20);
    Animated.parallel([
      Animated.timing(wordFade, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(wordSlide, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();

    // Reset timer
    elapsedRef.current = 0;
    setElapsed(0);
    setPhase('answering');
    setOptionStates(['default', 'default', 'default', 'default']);
    setAiChoiceIndex(null);

    timerRef.current = setInterval(() => {
      elapsedRef.current += 0.1;
      setElapsed(parseFloat(elapsedRef.current.toFixed(1)));

      if (elapsedRef.current >= QUESTION_DURATION) {
        clearInterval(timerRef.current!);
        handleTimeUp();
      }
    }, 100);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [qIndex, questions.length]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const currentQuestion: Question | undefined = questions[qIndex];

  function handleAnswer(selectedIndex: number) {
    if (!currentQuestion || phase === 'feedback') return;
    if (timerRef.current) clearInterval(timerRef.current);

    playSound('tap');
    const timeUsed = parseFloat(elapsedRef.current.toFixed(1));
    resolveQuestion(selectedIndex, timeUsed);
  }

  function handleTimeUp() {
    if (!currentQuestion || phase === 'feedback') return;
    playSound('timeout');
    resolveQuestion(null, QUESTION_DURATION);
  }

  function resolveQuestion(selectedIndex: number | null, timeUsed: number) {
    if (!currentQuestion) return;
    setPhase('feedback');

    const isCorrect = selectedIndex === currentQuestion.correctIndex;
    const score = calculateScore(isCorrect, timeUsed, QUESTION_DURATION);

    if (selectedIndex !== null) {
      playSound(isCorrect ? 'correct' : 'incorrect');
    }

    // AI answer
    const ai = simulateAIAnswer(currentQuestion, difficulty);
    const aiOptionIndex = ai.isCorrect
      ? currentQuestion.correctIndex
      : getRandomWrongIndex(currentQuestion.correctIndex, currentQuestion.options.length);

    // Build option states
    const newStates: OptionState[] = currentQuestion.options.map((_, i) => {
      if (i === currentQuestion.correctIndex) return 'correct';
      if (i === selectedIndex && !isCorrect) return 'incorrect';
      return 'disabled';
    });
    if (selectedIndex === null) {
      // timeout: just show correct
      const timeoutStates: OptionState[] = currentQuestion.options.map((_, i) =>
        i === currentQuestion.correctIndex ? 'correct' : 'disabled'
      );
      setOptionStates(timeoutStates);
    } else {
      setOptionStates(newStates);
    }
    setAiChoiceIndex(aiOptionIndex);

    // Update scores
    const playerAns: Answer = {
      questionId: currentQuestion.word.id,
      selectedIndex,
      isCorrect,
      timeUsed,
      score,
    };
    const aiAns: Answer = {
      questionId: currentQuestion.word.id,
      selectedIndex: aiOptionIndex,
      isCorrect: ai.isCorrect,
      timeUsed: ai.timeUsed,
      score: calculateScore(ai.isCorrect, ai.timeUsed, QUESTION_DURATION),
    };

    setPlayerAnswers((prev) => [...prev, playerAns]);
    setAiAnswers((prev) => [...prev, aiAns]);
    setPlayerScore((s) => s + playerAns.score);
    setAiScore((s) => s + aiAns.score);

    // After feedback delay, advance
    setTimeout(() => {
      const nextIndex = qIndex + 1;
      if (nextIndex >= TOTAL_QUESTIONS) {
        // Navigate to result
        const allPlayerAnswers = [...playerAnswers, playerAns];
        const allAiAnswers = [...aiAnswers, aiAns];
        const finalPlayerScore = allPlayerAnswers.reduce((s, a) => s + a.score, 0);
        const finalAiScore = allAiAnswers.reduce((s, a) => s + a.score, 0);

        const result: BattleResult = {
          outcome: determineBattleOutcome(finalPlayerScore, finalAiScore),
          playerTotalScore: finalPlayerScore,
          aiTotalScore: finalAiScore,
          questions,
          playerAnswers: allPlayerAnswers,
          aiAnswers: allAiAnswers,
          opponent,
        };

        router.replace({
          pathname: '/battle/result',
          params: { result: JSON.stringify(result) },
        });
      } else {
        setQIndex(nextIndex);
      }
    }, FEEDBACK_DURATION);
  }

  function getRandomWrongIndex(correctIndex: number, length: number): number {
    const options = Array.from({ length }, (_, i) => i).filter((i) => i !== correctIndex);
    return options[Math.floor(Math.random() * options.length)];
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>{s.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Score board */}
      <ScoreBoard
        playerScore={playerScore}
        playerLevel={playerLevel}
        opponentScore={aiScore}
        opponent={opponent}
        currentQuestion={qIndex + 1}
        totalQuestions={TOTAL_QUESTIONS}
      />

      <ScrollView contentContainerStyle={styles.body} bounces={false}>

        {/* Japanese word */}
        <Animated.View
          style={[styles.wordCard, { opacity: wordFade, transform: [{ translateY: wordSlide }] }]}
        >
          <Text style={styles.kana}>{currentQuestion.word.kana}</Text>
          <Text style={styles.category}>
            {getLang() === 'en'
              ? currentQuestion.word.category_en
              : currentQuestion.word.category}
          </Text>
        </Animated.View>

        {/* Timer */}
        <Timer
          duration={QUESTION_DURATION}
          elapsed={elapsed}
          isRunning={phase === 'answering'}
        />

        {/* AI indicator */}
        {aiChoiceIndex !== null && (
          <View style={styles.aiIndicator}>
            <Text style={styles.aiIndicatorText}>
              {s.aiIndicator(
                opponent.name,
                !!aiAnswers[aiAnswers.length - 1]?.isCorrect,
                aiAnswers[aiAnswers.length - 1]?.timeUsed.toFixed(1) ?? '0'
              )}
            </Text>
          </View>
        )}

        {/* Options 2×2 grid */}
        <View style={styles.optionsGrid}>
          <View style={styles.optionRow}>
            <OptionButton
              label={currentQuestion.options[0]}
              onPress={() => handleAnswer(0)}
              state={optionStates[0]}
            />
            <OptionButton
              label={currentQuestion.options[1]}
              onPress={() => handleAnswer(1)}
              state={optionStates[1]}
            />
          </View>
          <View style={styles.optionRow}>
            <OptionButton
              label={currentQuestion.options[2]}
              onPress={() => handleAnswer(2)}
              state={optionStates[2]}
            />
            <OptionButton
              label={currentQuestion.options[3]}
              onPress={() => handleAnswer(3)}
              state={optionStates[3]}
            />
          </View>
        </View>

        {/* AI choice overlay on options (shown in feedback) */}
        {aiChoiceIndex !== null && (
          <Text style={styles.aiChoice}>
            {getLang() === 'en'
              ? `${opponent.name} chose "${currentQuestion.options[aiChoiceIndex]}"`
              : `${opponent.name} 選了「${currentQuestion.options[aiChoiceIndex]}」`}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#2C3E50' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#fff', fontSize: 18 },

  body: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 20,
  },

  // Word card
  wordCard: {
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: '#34495E',
    borderRadius: 20,
    width: '100%',
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 8,
  },
  kana: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 2,
  },
  category: {
    fontSize: 12,
    color: '#7F8C8D',
    backgroundColor: '#2C3E50',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },

  // AI indicator (shown after answer)
  aiIndicator: {
    backgroundColor: '#34495E',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  aiIndicatorText: { color: '#BDC3C7', fontSize: 14, textAlign: 'center' },

  // Options
  optionsGrid: { width: '100%', gap: 0 },
  optionRow: { flexDirection: 'row', width: '100%' },

  // AI choice label
  aiChoice: {
    fontSize: 13,
    color: '#95A5A6',
    textAlign: 'center',
    marginTop: -8,
  },
});
