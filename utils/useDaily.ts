import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { loadDaily, onProgressChange, type DailySummary } from './progress';
import { loadWordLevel } from './storage';

/**
 * Today's missions, days and mastery for the home card, the Today tab and the
 * tab badge. Refreshes after every battle and when the app comes back to the
 * foreground (which also picks up a new day after midnight).
 */
export function useDaily(): DailySummary | null {
  const [daily, setDaily] = useState<DailySummary | null>(null);

  const refresh = useCallback(() => {
    loadWordLevel().then(loadDaily).then(setDaily).catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const off = onProgressChange(refresh);
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') refresh();
    });
    return () => {
      off();
      sub.remove();
    };
  }, [refresh]);

  return daily;
}
