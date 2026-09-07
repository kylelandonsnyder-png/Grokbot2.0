import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import {
  Card,
  Field,
  Heading,
  MoneyText,
  Muted,
  ProgressBar,
  Row,
  Screen,
  SectionLabel,
  Title,
} from '@/src/components/ui';
import { useTheme } from '@/src/hooks/useTheme';
import { formatMoney, formatPercent } from '@/src/lib/money';
import { computeNetWorth } from '@/src/lib/netWorth';
import { projectRetirement } from '@/src/lib/retirement';
import { useAppStore } from '@/src/store/appStore';

export default function OverviewScreen() {
  const theme = useTheme();
  const accounts = useAppStore((state) => state.accounts);
  const debts = useAppStore((state) => state.debts);
  const properties = useAppStore((state) => state.properties);
  const retirement = useAppStore((state) => state.retirement);
  const updateRetirement = useAppStore((state) => state.updateRetirement);

  const worth = useMemo(
    () => computeNetWorth({ accounts, debts, properties }),
    [accounts, debts, properties],
  );

  const projection = useMemo(
    () =>
      projectRetirement({
        ...retirement,
        currentBalance: worth.retirement,
      }),
    [retirement, worth.retirement],
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 16 }}>
        <View>
          <Muted>Household</Muted>
          <Title>Net worth</Title>
        </View>

        <Card>
          <MoneyText value={worth.netWorth} size={36} color={theme.text} />
          <Row>
            <Muted>Assets {formatMoney(worth.assets)}</Muted>
            <Muted>Liabilities {formatMoney(worth.liabilities)}</Muted>
          </Row>
        </Card>

        <AccountBlock title="Checking & savings" rows={worth.groups.cash} empty="No cash accounts" />
        <AccountBlock
          title="Investments"
          rows={worth.groups.investments}
          empty="No brokerage accounts"
        />
        <AccountBlock
          title="Retirement"
          rows={worth.groups.retirement}
          empty="No retirement accounts"
        />

        <View>
          <SectionLabel>Other debts</SectionLabel>
          <Card>
            {debts.length === 0 ? (
              <Muted>No cards, auto, or student loans tracked.</Muted>
            ) : (
              debts.map((debt) => (
                <Row key={debt.id}>
                  <View style={{ flex: 1 }}>
                    <Heading>{debt.name}</Heading>
                    <Muted>
                      {labelDebt(debt.kind)}
                      {debt.interestRate != null ? ` · ${formatPercent(debt.interestRate)} APR` : ''}
                    </Muted>
                  </View>
                  <MoneyText value={-debt.balance} size={16} exact color={theme.danger} />
                </Row>
              ))
            )}
          </Card>
        </View>

        <View>
          <SectionLabel>Retirement on track</SectionLabel>
          <Card>
            <Row>
              <Muted>Projected at {retirement.retirementAge}</Muted>
              <MoneyText
                value={projection.projected}
                size={20}
                color={projection.onTrack ? theme.accent : theme.warning}
              />
            </Row>
            <Muted>
              {projection.onTrack
                ? 'On track for the target nest egg with current savings and return assumptions.'
                : `Short by ${formatMoney(Math.max(0, projection.gap))}. Need about ${formatMoney(projection.monthlyNeeded)} / mo.`}
            </Muted>
            <ProgressBar
              value={retirement.targetNestEgg > 0 ? projection.projected / retirement.targetNestEgg : 0}
              color={projection.onTrack ? theme.accent : theme.warning}
            />
            <Assumption
              label="Current age"
              value={String(retirement.currentAge)}
              onChange={(value) => updateRetirement({ currentAge: Number(value) || 0 })}
            />
            <Assumption
              label="Retirement age"
              value={String(retirement.retirementAge)}
              onChange={(value) => updateRetirement({ retirementAge: Number(value) || 0 })}
            />
            <Assumption
              label="Monthly contribution"
              value={String(retirement.monthlyContribution)}
              onChange={(value) => updateRetirement({ monthlyContribution: Number(value) || 0 })}
            />
            <Assumption
              label="Expected annual return %"
              value={String(Math.round(retirement.expectedReturn * 1000) / 10)}
              onChange={(value) => updateRetirement({ expectedReturn: (Number(value) || 0) / 100 })}
            />
            <Assumption
              label="Target nest egg"
              value={String(retirement.targetNestEgg)}
              onChange={(value) => updateRetirement({ targetNestEgg: Number(value) || 0 })}
            />
            <Muted>Uses linked retirement balances ({formatMoney(worth.retirement)}).</Muted>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

function AccountBlock({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: { id: string; name: string; institution: string; balance: number; mask?: string }[];
  empty: string;
}) {
  const theme = useTheme();
  return (
    <View>
      <SectionLabel>{title}</SectionLabel>
      <Card>
        {rows.length === 0 ? (
          <Muted>{empty}</Muted>
        ) : (
          rows.map((account) => (
            <Row key={account.id}>
              <View style={{ flex: 1 }}>
                <Heading>{account.name}</Heading>
                <Muted>
                  {account.institution}
                  {account.mask ? ` ·••${account.mask}` : ''}
                </Muted>
              </View>
              <MoneyText
                value={account.balance}
                size={16}
                exact
                color={account.balance < 0 ? theme.danger : theme.text}
              />
            </Row>
          ))
        )}
      </Card>
    </View>
  );
}

function Assumption({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [local, setLocal] = useState(value);
  return (
    <Field
      label={label}
      value={local}
      onChangeText={(text) => {
        setLocal(text);
        onChange(text);
      }}
      keyboardType="decimal-pad"
    />
  );
}

function labelDebt(kind: string) {
  switch (kind) {
    case 'credit_card':
      return 'Credit card';
    case 'auto':
      return 'Auto';
    case 'student':
      return 'Student';
    case 'personal':
      return 'Personal';
    default:
      return 'Other';
  }
}
