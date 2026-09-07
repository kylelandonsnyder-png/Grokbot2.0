import * as WebBrowser from 'expo-web-browser';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { Card, Chip, Heading, Muted, PrimaryButton, Row, Screen } from '@/src/components/ui';
import { buildDemoTransactions } from '@/src/data/fixtures';
import { createId } from '@/src/lib/ids';
import {
  buildMockConnection,
  countLivePlaidItems,
  describeConnectionStatus,
  fetchPlaidHealth,
  fetchPlaidItems,
  fetchPlaidSnapshot,
  isPlaidServerConfigured,
  plaidLinkUrl,
  type PlaidHealth,
} from '@/src/lib/plaid';
import { useAppStore } from '@/src/store/appStore';

export default function ConnectScreen() {
  const items = useAppStore((state) => state.plaidItems);
  const connectMockInstitution = useAppStore((state) => state.connectMockInstitution);
  const ingestPlaidSnapshot = useAppStore((state) => state.ingestPlaidSnapshot);
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState<PlaidHealth | null>(null);

  const liveCount = countLivePlaidItems(items);
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

  async function connectLive() {
    if (!isPlaidServerConfigured()) {
      Alert.alert(
        'Demo mode',
        'No helper URL. Set EXPO_PUBLIC_PLAID_SERVER_URL after you start the sandbox server, or tap Use mock sandbox.',
      );
      return;
    }
    setBusy(true);
    try {
      const nextHealth = await fetchPlaidHealth();
      setHealth(nextHealth);
      if (!nextHealth.ok || nextHealth.mock) {
        Alert.alert(
          'Still in demo mode',
          nextHealth.reason ??
            'The helper has no Plaid secrets yet. Using on-device fixtures. Add sandbox keys to .env and restart the server to Link.',
        );
        await connectMock();
        return;
      }
      await WebBrowser.openBrowserAsync(plaidLinkUrl());
      await importFromServer();
    } catch (error) {
      Alert.alert('Could not open Link', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  async function connectMock() {
    const item = buildMockConnection('Plaid Sandbox (mock)');
    connectMockInstitution(item);
    await ingestPlaidSnapshot({
      item,
      accounts: [
        {
          id: createId('acct'),
          name: 'Plaid Checking',
          institution: 'First Platypus Bank',
          type: 'checking',
          balance: 2100,
          mask: '0000',
          plaidItemId: item.id,
        },
      ],
      transactions: buildDemoTransactions().slice(0, 3).map((txn) => ({
        ...txn,
        id: createId('txn'),
        plaidTransactionId: txn.id,
      })),
    });
    Alert.alert('Connected', 'Mock sandbox accounts were added on-device. This is still Demo mode, not Linked.');
  }

  async function importFromServer() {
    if (!isPlaidServerConfigured()) return;
    try {
      const serverItems = await fetchPlaidItems();
      if (serverItems.length === 0) {
        Alert.alert('No server items', 'Complete Link in the browser, then tap Import from helper.');
        return;
      }
      let added = 0;
      for (const item of serverItems) {
        const snapshot = await fetchPlaidSnapshot(item.itemId);
        added += await ingestPlaidSnapshot(snapshot);
      }
      Alert.alert('Linked', `Pulled ${serverItems.length} item(s). ${added} new transaction(s). Access tokens stayed on the server.`);
    } catch (error) {
      Alert.alert('Import failed', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Card>
          <Row>
            <Heading>Plaid</Heading>
            <Chip
              label={status.title}
              active={status.mode === 'linked' || status.mode === 'sandbox'}
            />
          </Row>
          <Muted>{status.detail}</Muted>
          <Muted>
            Link depository, credit, loan, and investment accounts. Token exchange happens on the
            local helper so access tokens never sit in the client. Sandbox is the default once keys
            exist; fixtures keep working if env is missing.
          </Muted>
          <PrimaryButton
            label={busy ? 'Opening…' : 'Open Plaid Link'}
            onPress={connectLive}
          />
          <PrimaryButton label="Use mock sandbox" onPress={connectMock} />
          <PrimaryButton label="Import from helper" onPress={importFromServer} />
        </Card>

        <Card>
          <Heading>Connected</Heading>
          {items.length === 0 ? (
            <Muted>Nothing linked yet. Demo fixtures still appear on Budget / Transactions.</Muted>
          ) : (
            items.map((item) => (
              <Row key={item.id}>
                <View style={{ flex: 1 }}>
                  <Heading>{item.institutionName}</Heading>
                  <Muted>
                    {item.source === 'plaid' ? 'Linked (Plaid)' : 'Demo / fixture'} · {item.products.join(', ')}
                  </Muted>
                </View>
              </Row>
            ))
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}
