import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import {
  Card,
  Chip,
  Field,
  Heading,
  MoneyText,
  Muted,
  PrimaryButton,
  ProgressBar,
  Row,
  Screen,
  SectionLabel,
  Title,
} from '@/src/components/ui';
import { useTheme } from '@/src/hooks/useTheme';
import { computeBudget } from '@/src/lib/budget';
import { currentMonthKey, monthLabel, shiftMonth } from '@/src/lib/dates';
import { formatMoney } from '@/src/lib/money';
import { useAppStore } from '@/src/store/appStore';

export default function BudgetScreen() {
  const theme = useTheme();
  const [month, setMonth] = useState(currentMonthKey());
  const [editing, setEditing] = useState<'income' | 'fixed' | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  const incomeSources = useAppStore((state) => state.incomeSources);
  const fixedExpenses = useAppStore((state) => state.fixedExpenses);
  const transactions = useAppStore((state) => state.transactions);
  const categories = useAppStore((state) => state.categories);
  const addIncomeSource = useAppStore((state) => state.addIncomeSource);
  const removeIncomeSource = useAppStore((state) => state.removeIncomeSource);
  const addFixedExpense = useAppStore((state) => state.addFixedExpense);
  const removeFixedExpense = useAppStore((state) => state.removeFixedExpense);

  const budget = useMemo(
    () => computeBudget({ incomeSources, fixedExpenses, transactions, categories, month }),
    [incomeSources, fixedExpenses, transactions, categories, month],
  );

  const spentRatio =
    budget.discretionaryAllowance <= 0
      ? 0
      : budget.discretionarySpent / budget.discretionaryAllowance;

  function submitLine() {
    const parsed = Number(amount);
    if (!name.trim() || Number.isNaN(parsed) || parsed < 0) {
      Alert.alert('Check the line item', 'Add a name and a monthly amount.');
      return;
    }
    if (editing === 'income') addIncomeSource(name.trim(), parsed);
    if (editing === 'fixed') addFixedExpense(name.trim(), parsed);
    setName('');
    setAmount('');
    setEditing(null);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}>
        <Row>
          <View>
            <Muted>Monthly plan</Muted>
            <Title>{monthLabel(month)}</Title>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <IconButton name="chevron-back" onPress={() => setMonth(shiftMonth(month, -1))} />
            <IconButton name="chevron-forward" onPress={() => setMonth(shiftMonth(month, 1))} />
          </View>
        </Row>

        <Card>
          <Muted>Discretionary leftover</Muted>
          <MoneyText value={budget.discretionaryAllowance} color={theme.accent} size={36} />
          <Muted>
            {formatMoney(budget.plannedIncome)} income − {formatMoney(budget.plannedFixed)} fixed
            costs
          </Muted>
          <Row>
            <Muted>Left to spend</Muted>
            <MoneyText
              value={budget.discretionaryRemaining}
              size={18}
              color={budget.discretionaryRemaining < 0 ? theme.danger : theme.text}
            />
          </Row>
          <ProgressBar
            value={spentRatio}
            color={spentRatio > 1 ? theme.danger : theme.accent}
          />
          <Row>
            <Muted>
              Spent {formatMoney(budget.discretionarySpent, true)} of{' '}
              {formatMoney(budget.discretionaryAllowance)}
            </Muted>
            <Muted>{Math.round(spentRatio * 100)}%</Muted>
          </Row>
        </Card>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Card style={{ flex: 1 }}>
            <Muted>Income</Muted>
            <MoneyText value={budget.plannedIncome} size={22} color={theme.accent} />
          </Card>
          <Card style={{ flex: 1 }}>
            <Muted>Fixed</Muted>
            <MoneyText value={-budget.plannedFixed} size={22} color={theme.danger} />
          </Card>
        </View>

        <View>
          <SectionLabel>Plan</SectionLabel>
          <Card>
            <Row>
              <Heading>Income</Heading>
              <Chip
                label={editing === 'income' ? 'Close' : 'Add'}
                active={editing === 'income'}
                onPress={() => setEditing(editing === 'income' ? null : 'income')}
              />
            </Row>
            {incomeSources.map((item) => (
              <Row key={item.id} onPress={() => removeIncomeSource(item.id)}>
                <Muted>{item.name}</Muted>
                <Muted>{formatMoney(item.monthlyAmount)}</Muted>
              </Row>
            ))}
            <Row>
              <Heading>Fixed costs</Heading>
              <Chip
                label={editing === 'fixed' ? 'Close' : 'Add'}
                active={editing === 'fixed'}
                onPress={() => setEditing(editing === 'fixed' ? null : 'fixed')}
              />
            </Row>
            {fixedExpenses.map((item) => (
              <Row key={item.id} onPress={() => removeFixedExpense(item.id)}>
                <Muted>{item.name}</Muted>
                <Muted>{formatMoney(item.monthlyAmount)}</Muted>
              </Row>
            ))}
            {editing ? (
              <View style={{ gap: 10, marginTop: 4 }}>
                <Field label="Name" value={name} onChangeText={setName} placeholder="Line item" />
                <Field
                  label="Monthly amount"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
                <PrimaryButton label={`Add ${editing === 'income' ? 'income' : 'fixed cost'}`} onPress={submitLine} />
                <Muted>Tap a line to remove it from the plan.</Muted>
              </View>
            ) : null}
          </Card>
        </View>

        <View>
          <SectionLabel>Category actuals</SectionLabel>
          <Card>
            {budget.categoryActuals.length === 0 ? (
              <Muted>No categorized activity this month yet.</Muted>
            ) : (
              budget.categoryActuals.map((row) => (
                <View key={row.categoryId} style={{ gap: 6 }}>
                  <Row>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: row.color }} />
                      <Muted>{row.name}</Muted>
                    </View>
                    <Muted>
                      {row.spent > 0
                        ? formatMoney(-row.spent, true)
                        : formatMoney(row.received, true)}
                    </Muted>
                  </Row>
                </View>
              ))
            )}
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

function IconButton({
  name,
  onPress,
}: {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.border,
      }}>
      <Ionicons name={name} size={18} color={theme.text} />
    </Pressable>
  );
}
