import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncPlayerData } from '../utils/cloudSync';
import { onProgressChange } from '../utils/progress';
import * as Notifications from 'expo-notifications';
import { rescheduleReminders } from '../utils/reminders';
import { logEvent, logFirstOpen } from '../utils/telemetry';

// Log a tapped reminder once (the launch response and the listener can both
// report the same tap, and the last response survives app restarts).
const OPENED_KEY = 'jp_king_last_push_opened';
async function logPushOpen(r: Notifications.NotificationResponse | null) {
  if (!r) return;
  try {
    const id = r.notification.request.identifier;
    if ((await AsyncStorage.getItem(OPENED_KEY)) === id) return;
    await AsyncStorage.setItem(OPENED_KEY, id);
    logEvent('open_from_push', { copy: String(r.notification.request.content.data?.copy ?? 'unknown') });
  } catch {
    // ignore
  }
}

export default function RootLayout() {
  // P2: sign in anonymously and reconcile local/cloud player data (best-effort).
  useEffect(() => {
    syncPlayerData();
    logFirstOpen();
  }, []);

  // Opened by tapping a reminder (also when it launched the app).
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync()
      .then(logPushOpen)
      .catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(logPushOpen);
    return () => sub.remove();
  }, []);

  // Daily reminders: re-plan on launch, on returning to the app and after each battle.
  useEffect(() => {
    rescheduleReminders();
    const off = onProgressChange(rescheduleReminders);
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') rescheduleReminders();
    });
    return () => {
      off();
      sub.remove();
    };
  }, []);

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#C41E3A' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="battle/matching" options={{ headerShown: false }} />
        <Stack.Screen name="battle/play" options={{ headerShown: false }} />
        <Stack.Screen name="battle/result" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
