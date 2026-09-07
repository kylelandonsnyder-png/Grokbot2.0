import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Switch, View } from 'react-native';

import { Card, GhostButton, Heading, Muted, PrimaryButton, Row, Screen } from '@/src/components/ui';
import { configureNotifications } from '@/src/lib/notifications';
import { fetchPlaidHealth, isPlaidServerConfigured } from '@/src/lib/plaid';
import { useAppStore } from '@/src/store/appStore';

export default function SettingsScreen() {
  const enabled = useAppStore((state) => state.settings.notificationsEnabled);
  const setNotificationsEnabled = useAppStore((state) => state.setNotificationsEnabled);
  const resetToDemo = useAppStore((state) => state.resetToDemo);
  const [health, setHealth] = useState<string | null>(null);

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
    setHealth(
      result.ok
        ? `Live Plaid server (${result.env ?? 'sandbox'})`
        : `Mock mode — ${result.reason ?? 'using on-device fixtures'}`,
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Card>
          <Heading>Data</Heading>
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
            {isPlaidServerConfigured()
              ? 'A Plaid helper server URL is set. Access tokens never live in the app.'
              : 'Plaid env is not set, so the UI runs on sandbox-shaped fixtures.'}
          </Muted>
          <Link href="/connect">
            <Muted style={{ textDecorationLine: 'underline' }}>Manage connections</Muted>
          </Link>
          <PrimaryButton label="Check Plaid status" onPress={checkPlaid} />
          {health ? <Muted>{health}</Muted> : null}
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
