import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
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
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
