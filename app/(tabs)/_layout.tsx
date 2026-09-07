import { Ionicons } from '@expo/vector-icons';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useTheme } from '@/src/hooks/useTheme';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.border,
        },
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        headerShown: useClientOnlyValue(false, true),
        headerRight: () => (
          <Link href="/settings" asChild>
            <Pressable style={{ marginRight: 16 }}>
              {({ pressed }) => (
                <Ionicons name="settings-outline" size={22} color={theme.text} style={{ opacity: pressed ? 0.5 : 1 }} />
              )}
            </Pressable>
          </Link>
        ),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Budget',
          tabBarIcon: ({ color, size }) => <Ionicons name="pie-chart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="overview"
        options={{
          title: 'Overview',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="real-estate"
        options={{
          title: 'Real Estate',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
