import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, View } from 'react-native';

import { Card, Heading, MoneyText, Muted, Screen, SectionLabel } from '@/src/components/ui';
import { useTheme } from '@/src/hooks/useTheme';
import { formatDateLong } from '@/src/lib/dates';
import { useAppStore } from '@/src/store/appStore';

export default function TransactionDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const txn = useAppStore((state) => state.transactions.find((item) => item.id === id));
  const categories = useAppStore((state) => state.categories);
  const accounts = useAppStore((state) => state.accounts);
  const recategorizeTransaction = useAppStore((state) => state.recategorizeTransaction);
  const [remember, setRemember] = useState(true);

  if (!txn) {
    return (
      <Screen>
        <Muted style={{ padding: 20 }}>Transaction not found.</Muted>
      </Screen>
    );
  }

  const account = accounts.find((item) => item.id === txn.accountId);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Card>
          <Muted>{formatDateLong(txn.date)}</Muted>
          <Heading>{txn.merchant}</Heading>
          <MoneyText
            value={txn.amount}
            exact
            signed
            size={32}
            color={txn.isTransfer ? theme.muted : txn.amount < 0 ? theme.danger : theme.accent}
          />
          <Muted>
            {account ? `${account.institution} ${account.name}` : 'Unknown account'}
            {txn.isTransfer ? ' · Transfer (excluded from spend)' : ''}
          </Muted>
        </Card>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Muted>Always categorize this merchant</Muted>
          <Switch value={remember} onValueChange={setRemember} />
        </View>

        <SectionLabel>Category</SectionLabel>
        {categories.map((category) => {
          const active = category.id === txn.categoryId;
          return (
            <Pressable
              key={category.id}
              onPress={() => {
                recategorizeTransaction(txn.id, category.id, remember);
                if (remember) {
                  Alert.alert('Rule saved', `${txn.merchant} will use ${category.name}.`);
                }
              }}
              style={{
                padding: 14,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: active ? theme.accent : theme.border,
                backgroundColor: active ? theme.accentSoft : theme.card,
              }}>
              <Heading>{category.name}</Heading>
              <Muted>
                {category.kind}
                {category.kind === 'transfer' ? ' · does not count as spend' : ''}
              </Muted>
            </Pressable>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
