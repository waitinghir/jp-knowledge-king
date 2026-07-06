import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useStrings } from '../../utils/i18n';

export default function TabLayout() {
  const s = useStrings();
  return (
    <Tabs
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
        name="leaderboard"
        options={{
          title: s.leaderboardTab,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏆</Text>,
        }}
      />
    </Tabs>
  );
}
