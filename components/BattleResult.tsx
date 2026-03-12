import { View, Text, StyleSheet } from 'react-native';

// TODO: Implement battle result animation component
// Props:
//   - result: 'win' | 'lose' | 'draw'
// Behavior:
//   - 'win': 大字「勝利！」with confetti animation (use react-native-reanimated)
//   - 'lose': 「惜敗！」with encouraging text
//   - 'draw': 「平手！」
// This component is shown at the top of the result page

type BattleOutcome = 'win' | 'lose' | 'draw';

interface BattleResultProps {
  result: BattleOutcome;
}

const resultConfig: Record<BattleOutcome, { emoji: string; text: string; color: string }> = {
  win: { emoji: '🏆', text: '勝利！', color: '#F1C40F' },
  lose: { emoji: '😤', text: '惜敗！', color: '#E74C3C' },
  draw: { emoji: '🤝', text: '平手！', color: '#3498DB' },
};

export default function BattleResult({ result }: BattleResultProps) {
  const config = resultConfig[result];
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{config.emoji}</Text>
      <Text style={[styles.text, { color: config.color }]}>{config.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  text: {
    fontSize: 48,
    fontWeight: 'bold',
  },
});
