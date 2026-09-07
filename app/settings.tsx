import { Link, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Switch, View } from 'react-native';

import { Card, Chip, GhostButton, Heading, Muted, PrimaryButton, Row, Screen } from '@/src/components/ui';
import { useSignOutAndReset } from '@/src/hooks/useAuthSession';
import { configureNotifications } from '@/src/lib/notifications';
import {
  countLivePlaidItems,
  describeConnectionStatus,
  fetchPlaidHealth,
  isPlaidServerConfigured,
  type PlaidHealth,
} from '@/src/lib/plaid';
import { isSupabaseConfigured } from '@/src/lib/supabase';
import { useAppStore } from '@/src/store/appStore';
import { useAuthStore } from '@/src/store/authStore';

export default function SettingsScreen() {
  const enabled = useAppStore((state) => state.settings.notificationsEnabled);
  const setNotificationsEnabled = useAppStore((state) => state.setNotificationsEnabled);
  const resetToDemo = useAppStore((state) => state.resetToDemo);
  const plaidItems = useAppStore((state) => state.plaidItems);
  const session = useAuthStore((state) => state.session);
  const signOutAndReset = useSignOutAndReset();
  const [health, setHealth] = useState<PlaidHealth | null>(null);
  const [healthNote, setHealthNote] = useState<string | null>(null);

  const liveCount = countLivePlaidItems(plaidItems);
  const status = useMemo(
    () =>
      describeConnectionStatus({
        serverConfigured: isPlaidServerConfigured(),
        health,
        liveItemCount: liveCount,
      }),
    [health, liveCount],
  );

  useEffect(() => {
    if (!isPlaidServerConfigured()) return;
    void fetchPlaidHealth().then(setHealth);
  }, []);

  async function toggleNotifications(next: boolean) {
    if (!next) {
      setNotificationsEnabled(false);
      return;
    }
    const result = await configureNotifications();
    setNotificationsEnabled(result.ok);
    if (!result.ok) {
      Alert.alert(
        'Notifications unavailable',
        result.reason === 'web'
          ? 'Push is wired for iOS/Android builds. The app still works without it.'
          : 'Permission was not granted. You can keep using the app without alerts.',
      );
    }
  }

  async function checkPlaid() {
    const result = await fetchPlaidHealth();
    setHealth(result);
    setHealthNote(
      result.ok
        ? `Helper live · ${result.env ?? 'sandbox'} · tokens server-side only`
        : `Still demo-safe — ${result.reason ?? 'using on-device fixtures'}`,
    );
  }

  async function logout() {
    await signOutAndReset();
    router.replace('/login');
  }

  const cloud = Boolean(session);
  const email = session?.user.email ?? null;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Card>
          <Row>
            <Heading>Account</Heading>
            <Chip label={cloud ? 'Signed in' : 'Local demo'} active={cloud} />
          </Row>
          <Muted>
            {cloud
              ? `Signed in as ${email ?? 'your account'}. Budget, transactions, and properties sync to Supabase.`
              : isSupabaseConfigured()
                ? 'You are on this device only. Create an account to sync across phones and web.'
                : 'Supabase is not configured, so the app stays local. Add EXPO_PUBLIC_SUPABASE_* to enable signup.'}
          </Muted>
          {cloud ? (
            <GhostButton label="Log out" onPress={logout} />
          ) : (
            <Link href="/login">
              <Muted style={{ textDecorationLine: 'underline' }}>Log in or create an account</Muted>
            </Link>
          )}
        </Card>

        <Card>
          <Row>
            <Heading>Data</Heading>
            <Chip label={status.title} active={status.mode === 'linked' || status.mode === 'sandbox'} />
          </Row>
          <Muted>{status.detail}</Muted>
          <Muted>
            {cloud
              ? 'Cloud rows are scoped to your user id (RLS). This device also keeps an AsyncStorage cache.'
              : 'Demo data lives in AsyncStorage on this device until you sign in.'}
          </Muted>
          <GhostButton
            label="Reset demo data"
            onPress={() => {
              resetToDemo();
              Alert.alert('Restored', 'Demo accounts, budget, and properties were reloaded.');
            }}
          />
        </Card>

        <Card>
          <Heading>Banks & brokerages</Heading>
          <Muted>
            Plaid bank linking is later. Fixtures (and a sandbox helper if you already set one up) still
            work. Do not block launch on Plaid.
          </Muted>
          <Link href="/connect">
            <Muted style={{ textDecorationLine: 'underline' }}>Manage connections</Muted>
          </Link>
          <PrimaryButton label="Check Plaid status" onPress={checkPlaid} />
          {healthNote ? <Muted>{healthNote}</Muted> : null}
        </Card>

        <Card>
          <Row>
            <View style={{ flex: 1 }}>
              <Heading>New transaction alerts</Heading>
              <Muted>Optional local notifications. The app does not require push setup.</Muted>
            </View>
            <Switch value={enabled} onValueChange={toggleNotifications} />
          </Row>
        </Card>

        <Card>
          <Heading>Merchant rules</Heading>
          <Link href="/rules">
            <Muted style={{ textDecorationLine: 'underline' }}>Edit automatic categories</Muted>
          </Link>
        </Card>
      </ScrollView>
    </Screen>
  );
}
