import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useStrings } from '../../utils/i18n';
import { useDaily } from '../../utils/useDaily';
import { logEvent } from '../../utils/telemetry';

export default function TabLayout() {
  const s = useStrings();
  const daily = useDaily();
  return (
    <Tabs
      // 1.8.2: every time a tab comes into view (tap, or a button that leads
      // there), so we can see how often each tab - the leaderboard above all -
      // is actually opened before deciding its future.
      screenListeners={({ route }) => ({
        focus: () => logEvent('tab_view', { tab: route.name }),
      })}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1C2833',
          borderTopColor: '#34495E',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#C41E3A',
        tabBarInactiveTintColor: '#7F8C8D',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: s.homeTab,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="today"
        options={{
          title: s.todayTab,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🔥</Text>,
          // missions left today
          tabBarBadge: daily ? daily.missions.length - daily.missionsDone || undefined : undefined,
          tabBarBadgeStyle: { backgroundColor: '#C41E3A', fontSize: 11 },
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: s.leaderboardTab,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏆</Text>,
        }}
      />
    </Tabs>
  );
}
