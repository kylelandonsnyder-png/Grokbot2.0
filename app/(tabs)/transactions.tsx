import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, TextInput, View } from 'react-native';

import { Card, Chip, MoneyText, Muted, Row, Screen, Title } from '@/src/components/ui';
import { useTheme } from '@/src/hooks/useTheme';
import { currentMonthKey, formatDateLong, isInMonth, monthLabel } from '@/src/lib/dates';
import { useAppStore } from '@/src/store/appStore';

type Filter = 'all' | 'spend' | 'income' | 'transfer';

export default function TransactionsScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const month = currentMonthKey();

  const transactions = useAppStore((state) => state.transactions);
  const categories = useAppStore((state) => state.categories);
  const accounts = useAppStore((state) => state.accounts);

  const rows = useMemo(() => {
    return transactions
      .filter((txn) => isInMonth(txn.date, month))
      .filter((txn) => {
        if (filter === 'spend') return !txn.isTransfer && txn.amount < 0;
        if (filter === 'income') return !txn.isTransfer && txn.amount > 0;
        if (filter === 'transfer') return txn.isTransfer;
        return true;
      })
      .filter((txn) => (categoryId ? txn.categoryId === categoryId : true))
      .filter((txn) => txn.merchant.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date) || a.merchant.localeCompare(b.merchant));
  }, [transactions, month, filter, categoryId, query]);

  return (
    <Screen>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 10 }}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 6 }}>
            <View>
              <Muted>{monthLabel(month)}</Muted>
              <Title>Activity</Title>
            </View>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search merchants"
              placeholderTextColor={theme.muted}
              style={{
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.card,
                color: theme.text,
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 16,
              }}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(['all', 'spend', 'income', 'transfer'] as Filter[]).map((item) => (
                <Chip
                  key={item}
                  label={item[0].toUpperCase() + item.slice(1)}
                  active={filter === item}
                  onPress={() => setFilter(item)}
                />
              ))}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Chip label="Any category" active={!categoryId} onPress={() => setCategoryId(null)} />
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  active={categoryId === category.id}
                  onPress={() => setCategoryId(category.id)}
                />
              ))}
            </View>
            <Muted>
              Transfers are tagged so credit-card payments and 401(k) moves do not inflate spend.
            </Muted>
          </View>
        }
        renderItem={({ item }) => {
          const category = categories.find((cat) => cat.id === item.categoryId);
          const account = accounts.find((acct) => acct.id === item.accountId);
          return (
            <Card onPress={() => router.push(`/transaction/${item.id}`)}>
              <Row>
                <View style={{ flex: 1, gap: 2 }}>
                  <Muted style={{ color: theme.text, fontWeight: '700' }}>{item.merchant}</Muted>
                  <Muted>
                    {formatDateLong(item.date)} · {category?.name ?? 'Uncategorized'}
                    {account ? ` · ${account.name}` : ''}
                    {item.isTransfer ? ' · Transfer' : ''}
                  </Muted>
                </View>
                <MoneyText
                  value={item.amount}
                  exact
                  signed
                  size={16}
                  color={item.isTransfer ? theme.muted : item.amount < 0 ? theme.danger : theme.accent}
                />
              </Row>
            </Card>
          );
        }}
        ListEmptyComponent={<Muted>No transactions match these filters.</Muted>}
      />
    </Screen>
  );
}
