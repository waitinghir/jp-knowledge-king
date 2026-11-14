import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppState } from 'react-native';
import { syncPlayerData } from '../utils/cloudSync';
import { onProgressChange } from '../utils/progress';
import { rescheduleReminders } from '../utils/reminders';

export default function RootLayout() {
  // P2: sign in anonymously and reconcile local/cloud player data (best-effort).
  useEffect(() => {
    syncPlayerData();
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
