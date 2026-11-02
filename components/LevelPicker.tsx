import { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { WordLevel } from '../types';
import type { Strings } from '../utils/i18n';
import { markLevelHintSeen, shouldShowLevelHint } from '../utils/storage';

// One ladder from easiest to hardest: kana first, then JLPT levels.
export const LEVELS: WordLevel[] = ['hiragana', 'katakana', 'N5', 'N4', 'N3', 'N2', '生活', 'all'];

const LEVEL_LABEL = {
  N5: 'levelN5',
  N4: 'levelN4',
  N3: 'levelN3',
  N2: 'levelN2',
  生活: 'levelLife',
  all: 'levelAll',
  hiragana: 'levelHiragana',
  katakana: 'levelKatakana',
} as const satisfies Record<WordLevel, keyof Strings>;

// The kana levels are shown as the kana itself, in every UI language.
const KANA_GLYPH: Partial<Record<WordLevel, string>> = { hiragana: 'あ', katakana: 'ア' };

interface Props {
  value: WordLevel;
  onChange: (level: WordLevel) => void;
  s: Strings;
}

/**
 * Swipeable level picker: one level at a time, big, with arrows and dots.
 * Swipe or tap ‹ › to move along the ladder; tap a dot to jump.
 */
export default function LevelPicker({ value, onChange, s }: Props) {
  const scroll = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const index = Math.max(0, LEVELS.indexOf(value));
  // Only a finger swipe may change the level from a scroll event; scrolls we
  // start ourselves (storage load, arrow, dot) also fire onMomentumScrollEnd.
  const dragging = useRef(false);
  const shown = useRef(false);

  // Keep the page in sync when the level comes from storage or a tap.
  useEffect(() => {
    if (width === 0) return;
    scroll.current?.scrollTo({ x: index * width, animated: shown.current });
    shown.current = true;
  }, [index, width]);

  // First launch only: peek at the next level and spring back, so new players
  // see the level can be swiped.
  useEffect(() => {
    if (width === 0) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    shouldShowLevelHint().then((show) => {
      if (!show) return;
      markLevelHintSeen();
      const at = (ms: number, dx: number) =>
        timers.push(setTimeout(() => scroll.current?.scrollTo({ x: index * width + dx, animated: true }), ms));
      at(800, width * 0.28);
      at(1300, 0);
      at(1700, -width * 0.28);
      at(2200, 0);
    });
    return () => timers.forEach(clearTimeout);
  }, [width]);

  const go = (i: number) => {
    const next = Math.min(LEVELS.length - 1, Math.max(0, i));
    if (next !== index) onChange(LEVELS[next]);
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!dragging.current || width === 0) return;
    dragging.current = false;
    go(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.pager} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <ScrollView
          ref={scroll}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={() => { dragging.current = true; }}
          onMomentumScrollEnd={onScrollEnd}
        >
          {LEVELS.map((lv) => (
            <View key={lv} style={[styles.page, { width }]}>
              <Text style={[styles.label, KANA_GLYPH[lv] ? styles.labelKana : null]}>
                {KANA_GLYPH[lv] ?? s[LEVEL_LABEL[lv]]}
              </Text>
              <Text style={styles.caption}>{s.levelCaption[lv]}</Text>
            </View>
          ))}
        </ScrollView>

        <Pressable
          style={[styles.arrow, styles.arrowLeft]}
          onPress={() => go(index - 1)}
          disabled={index === 0}
          hitSlop={12}
        >
          <Text style={[styles.arrowText, index === 0 && styles.arrowDisabled]}>‹</Text>
        </Pressable>
        <Pressable
          style={[styles.arrow, styles.arrowRight]}
          onPress={() => go(index + 1)}
          disabled={index === LEVELS.length - 1}
          hitSlop={12}
        >
          <Text style={[styles.arrowText, index === LEVELS.length - 1 && styles.arrowDisabled]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.dots}>
        {LEVELS.map((lv, i) => (
          <Pressable key={lv} onPress={() => go(i)} hitSlop={6}>
            <View style={[styles.dot, i === index && styles.dotActive]} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', alignItems: 'center', gap: 12 },
  pager: { alignSelf: 'stretch', height: 84 },
  page: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  label: { fontSize: 40, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  labelKana: { fontSize: 44 },
  caption: { fontSize: 13, color: '#95A5A6' },
  arrow: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: 8 },
  arrowLeft: { left: 0 },
  arrowRight: { right: 0 },
  arrowText: { fontSize: 36, color: '#95A5A6', fontWeight: '300' },
  arrowDisabled: { opacity: 0.2 },
  dots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4A6278' },
  dotActive: { width: 18, backgroundColor: '#C41E3A' },
});
