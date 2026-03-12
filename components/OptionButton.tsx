import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

export type OptionState = 'default' | 'correct' | 'incorrect' | 'disabled';

interface OptionButtonProps {
  label: string;
  onPress: () => void;
  state?: OptionState;
}

const BG: Record<OptionState, string> = {
  default: '#F0F3F4',
  correct: '#27AE60',
  incorrect: '#E74C3C',
  disabled: '#BDC3C7',
};

const TEXT_COLOR: Record<OptionState, string> = {
  default: '#2C3E50',
  correct: '#fff',
  incorrect: '#fff',
  disabled: '#7F8C8D',
};

export default function OptionButton({ label, onPress, state = 'default' }: OptionButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Correct: bounce scale up
  useEffect(() => {
    if (state === 'correct') {
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.08, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
      ]).start();
    }
  }, [state, scaleAnim]);

  // Incorrect: horizontal shake
  useEffect(() => {
    if (state === 'incorrect') {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [state, shakeAnim]);

  const isDisabled = state !== 'default';
  const icon = state === 'correct' ? ' ✓' : state === 'incorrect' ? ' ✗' : '';

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          transform: [{ scale: scaleAnim }, { translateX: shakeAnim }],
          backgroundColor: BG[state],
        },
      ]}
    >
      <Pressable
        style={styles.pressable}
        onPress={onPress}
        disabled={isDisabled}
        android_ripple={{ color: '#ccc' }}
      >
        <Text style={[styles.label, { color: TEXT_COLOR[state] }]} numberOfLines={2}>
          {label}{icon}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    margin: 6,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  pressable: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
});
