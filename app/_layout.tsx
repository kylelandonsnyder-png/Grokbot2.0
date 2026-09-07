import { DarkTheme, DefaultTheme, Stack, ThemeProvider, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useAuthSession } from '@/src/hooks/useAuthSession';
import { useCloudSync } from '@/src/hooks/useCloudSync';
import { useTheme } from '@/src/hooks/useTheme';
import { useAppStore } from '@/src/store/appStore';
import { needsAuthScreen, useAuthStore } from '@/src/store/authStore';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const hydrated = useAppStore((state) => state.hydrated);
  const setHydrated = useAppStore((state) => state.setHydrated);
  const authReady = useAuthStore((state) => state.ready);
  const session = useAuthStore((state) => state.session);
  const demoUnlocked = useAuthStore((state) => state.demoUnlocked);
  const pathname = usePathname();
  const router = useRouter();

  useAuthSession();
  useCloudSync();

  useEffect(() => {
    const persistApi = useAppStore.persist;
    if (persistApi.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = persistApi.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, [setHydrated]);

  const ready = hydrated && authReady;
  const gate = needsAuthScreen({ session, demoUnlocked });
  const onAuthRoute = pathname === '/login' || pathname === '/signup';

  useEffect(() => {
    if (!ready) return;
    if (gate && !onAuthRoute) {
      router.replace('/login');
    } else if (!gate && onAuthRoute && session) {
      router.replace('/');
    }
  }, [gate, onAuthRoute, ready, router, session]);

  if (!ready) {
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
        <Stack.Screen name="login" options={{ title: 'Log in', headerShown: false }} />
        <Stack.Screen name="signup" options={{ title: 'Sign up', headerShown: false }} />
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
