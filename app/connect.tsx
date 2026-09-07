import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { Card, Heading, Muted, PrimaryButton, Row, Screen } from '@/src/components/ui';
import { buildDemoTransactions } from '@/src/data/fixtures';
import { createId } from '@/src/lib/ids';
import {
  buildMockConnection,
  fetchPlaidHealth,
  fetchPlaidItems,
  fetchPlaidSnapshot,
  isPlaidServerConfigured,
  plaidLinkUrl,
} from '@/src/lib/plaid';
import { useAppStore } from '@/src/store/appStore';

export default function ConnectScreen() {
  const items = useAppStore((state) => state.plaidItems);
  const connectMockInstitution = useAppStore((state) => state.connectMockInstitution);
  const ingestPlaidSnapshot = useAppStore((state) => state.ingestPlaidSnapshot);
  const [busy, setBusy] = useState(false);

  async function connectLive() {
    if (!isPlaidServerConfigured()) {
      Alert.alert('Plaid server missing', 'Set EXPO_PUBLIC_PLAID_SERVER_URL or use mock mode.');
      return;
    }
    setBusy(true);
    try {
      const health = await fetchPlaidHealth();
      if (!health.ok || health.mock) {
        Alert.alert(
          'Sandbox not ready',
          health.reason ?? 'The helper server is in mock mode. Using fixtures instead.',
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
    Alert.alert('Connected', 'Mock sandbox accounts were added on-device.');
  }

  async function importFromServer() {
    if (!isPlaidServerConfigured()) return;
    try {
      const items = await fetchPlaidItems();
      if (items.length === 0) {
        Alert.alert('No server items', 'Complete Link in the browser, then tap Import from helper.');
        return;
      }
      let added = 0;
      for (const item of items) {
        const snapshot = await fetchPlaidSnapshot(item.itemId);
        added += await ingestPlaidSnapshot(snapshot);
      }
      Alert.alert('Imported', `Pulled ${items.length} item(s). ${added} new transaction(s).`);
    } catch (error) {
      Alert.alert('Import failed', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Card>
          <Heading>Plaid</Heading>
          <Muted>
            Link depository, credit, loan, and investment accounts. Token exchange happens on the
            local helper server so access tokens never sit in the client.
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
            <Muted>Nothing linked yet.</Muted>
          ) : (
            items.map((item) => (
              <Row key={item.id}>
                <View style={{ flex: 1 }}>
                  <Heading>{item.institutionName}</Heading>
                  <Muted>
                    {item.source === 'mock' ? 'Mock / fixture' : 'Plaid'} · {item.products.join(', ')}
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
