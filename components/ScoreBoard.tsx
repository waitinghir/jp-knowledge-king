import { View, Text, StyleSheet } from 'react-native';
import { AIOpponent } from '../types';

// TODO: Implement live scoreboard header
// Shows: player avatar+name+score (left), question number (center), opponent avatar+name+score (right)
// Score updates animate (number jump) when either side answers correctly

interface ScoreBoardProps {
  playerScore: number;
  playerLevel: number;
  opponentScore: number;
  opponent: AIOpponent;
  currentQuestion: number;
  totalQuestions: number;
}

export default function ScoreBoard({
  playerScore,
  playerLevel,
  opponentScore,
  opponent,
  currentQuestion,
  totalQuestions,
}: ScoreBoardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.side}>
        <View style={[styles.avatar, { backgroundColor: '#C41E3A' }]}>
          <Text style={styles.avatarText}>你</Text>
        </View>
        <Text style={styles.name}>Lv.{playerLevel}</Text>
        <Text style={styles.score}>{playerScore}</Text>
      </View>

      <View style={styles.center}>
        <Text style={styles.questionNum}>{currentQuestion}/{totalQuestions}</Text>
      </View>

      <View style={styles.side}>
        <View style={[styles.avatar, { backgroundColor: opponent.avatarColor }]}>
          <Text style={styles.avatarText}>{opponent.name[0]}</Text>
        </View>
        <Text style={styles.name}>{opponent.name}</Text>
        <Text style={styles.score}>{opponentScore}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2C3E50',
  },
  side: {
    flex: 1,
    alignItems: 'center',
  },
  center: {
    flex: 0.8,
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  name: {
    color: '#ccc',
    fontSize: 12,
  },
  score: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  questionNum: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
