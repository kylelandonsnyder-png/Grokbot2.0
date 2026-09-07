import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import {
  Card,
  Heading,
  MoneyText,
  Muted,
  PrimaryButton,
  Row,
  Screen,
  SectionLabel,
  Title,
} from '@/src/components/ui';
import { useTheme } from '@/src/hooks/useTheme';
import { formatMoney, formatPercent } from '@/src/lib/money';
import { computePortfolioMetrics } from '@/src/lib/realEstate';
import { useAppStore } from '@/src/store/appStore';

export default function RealEstateScreen() {
  const theme = useTheme();
  const properties = useAppStore((state) => state.properties);
  const portfolio = computePortfolioMetrics(properties);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 16 }}>
        <View>
          <Muted>Portfolio</Muted>
          <Title>Real estate</Title>
        </View>

        <Card>
          <Muted>Rental profit this month</Muted>
          <MoneyText value={portfolio.monthlyProfit} size={32} color={theme.accent} />
          <Row>
            <Muted>Equity {formatMoney(portfolio.totalEquity)}</Muted>
            <Muted>Value {formatMoney(portfolio.totalValue)}</Muted>
          </Row>
        </Card>

        <PrimaryButton label="Add property" icon="add" onPress={() => router.push('/property/new')} />

        {portfolio.rows.map(({ property, metrics }) => (
          <Card key={property.id} onPress={() => router.push(`/property/${property.id}`)}>
            <Row>
              <View style={{ flex: 1 }}>
                <Heading>{property.name}</Heading>
                <Muted>{property.address}</Muted>
              </View>
              <MoneyText
                value={metrics.monthlyProfit}
                size={18}
                color={metrics.monthlyProfit >= 0 ? theme.accent : theme.danger}
              />
            </Row>
            <Row>
              <Muted>Equity {formatMoney(metrics.equity)}</Muted>
              <Muted>
                {property.occupancy === 'owner'
                  ? 'Owner-occupied'
                  : `${metrics.occupiedUnits}/${property.units} occupied`}
              </Muted>
            </Row>
            {property.occupancy === 'rental' ? (
              <View style={{ gap: 6 }}>
                <SectionLabel>Yield</SectionLabel>
                <Row>
                  <Muted>Vacancy {formatPercent(property.vacancyRate)}</Muted>
                  <Muted>Eff. rent {formatMoney(metrics.effectiveRent)}</Muted>
                </Row>
                <Row>
                  <Muted>ROI on equity {formatPercent(metrics.roiOnEquity)}</Muted>
                  <Muted>Monthly return {formatPercent(metrics.monthlyReturn, 2)}</Muted>
                </Row>
              </View>
            ) : null}
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
