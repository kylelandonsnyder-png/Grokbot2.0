import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useTheme } from '@/src/hooks/useTheme';
import { useAppStore } from '@/src/store/appStore';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const hydrated = useAppStore((state) => state.hydrated);
  const setHydrated = useAppStore((state) => state.setHydrated);

  useEffect(() => {
    const persistApi = useAppStore.persist;
    if (persistApi.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = persistApi.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, [setHydrated]);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.bg }}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.text,
          contentStyle: { backgroundColor: theme.bg },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="rules" options={{ title: 'Merchant rules' }} />
        <Stack.Screen name="connect" options={{ title: 'Accounts' }} />
        <Stack.Screen name="transaction/[id]" options={{ title: 'Transaction' }} />
        <Stack.Screen name="property/[id]" options={{ title: 'Property' }} />
        <Stack.Screen name="property/new" options={{ title: 'Add property' }} />
      </Stack>
    </ThemeProvider>
  );
}
