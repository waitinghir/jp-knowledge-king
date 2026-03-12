import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const SIZE = 88;
const STROKE = 7;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const DANGER_SECONDS = 3;

interface TimerProps {
  duration?: number;
  elapsed: number;      // seconds elapsed so far (driven by parent)
  isRunning?: boolean;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function Timer({ duration = 10, elapsed, isRunning = true }: TimerProps) {
  const remaining = Math.max(0, duration - elapsed);
  const displaySeconds = Math.ceil(remaining);
  const isDanger = displaySeconds <= DANGER_SECONDS;

  // Stroke dash offset animation
  const progress = useRef(new Animated.Value(elapsed / duration)).current;

  useEffect(() => {
    if (!isRunning) return;
    Animated.timing(progress, {
      toValue: elapsed / duration,
      duration: 100,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [elapsed, isRunning, duration, progress]);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, CIRCUMFERENCE],
  });

  // Pulse animation for danger zone
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isDanger || !isRunning) {
      pulse.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 250, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 250, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [isDanger, isRunning, pulse]);

  const ringColor = isDanger ? '#E74C3C' : '#C41E3A';
  const textColor = isDanger ? '#E74C3C' : '#fff';

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: pulse }] }]}>
      <Svg width={SIZE} height={SIZE}>
        {/* Background ring */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="#4A6278"
          strokeWidth={STROKE}
          fill="none"
        />
        {/* Progress ring */}
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={ringColor}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      <View style={styles.labelContainer} pointerEvents="none">
        <Text style={[styles.label, { color: textColor }]}>{displaySeconds}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 28,
    fontWeight: 'bold',
  },
});
