import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Switch, View } from 'react-native';

import { Card, Chip, GhostButton, Heading, Muted, PrimaryButton, Row, Screen } from '@/src/components/ui';
import { configureNotifications } from '@/src/lib/notifications';
import {
  countLivePlaidItems,
  describeConnectionStatus,
  fetchPlaidHealth,
  isPlaidServerConfigured,
  type PlaidHealth,
} from '@/src/lib/plaid';
import { useAppStore } from '@/src/store/appStore';

export default function SettingsScreen() {
  const enabled = useAppStore((state) => state.settings.notificationsEnabled);
  const setNotificationsEnabled = useAppStore((state) => state.setNotificationsEnabled);
  const resetToDemo = useAppStore((state) => state.resetToDemo);
  const plaidItems = useAppStore((state) => state.plaidItems);
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

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Card>
          <Row>
            <Heading>Data</Heading>
            <Chip label={status.title} active={status.mode === 'linked' || status.mode === 'sandbox'} />
          </Row>
          <Muted>{status.detail}</Muted>
          <Muted>
            v1 is local-only. Accounts, budgets, and properties stay on this device via AsyncStorage.
            There is no cloud login or sync.
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
            {status.mode === 'linked'
              ? 'Linked — you imported a live Plaid item. Access tokens never live in the app.'
              : status.mode === 'sandbox' || status.mode === 'production'
                ? `${status.title}. Open Settings → Manage connections to run Link, then Import from helper.`
                : 'Demo mode vs Linked: right now you are on fixtures. Set sandbox keys + EXPO_PUBLIC_PLAID_SERVER_URL only when you want real Link.'}
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
