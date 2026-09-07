import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { Chip, Field, Muted, PrimaryButton, Screen } from '@/src/components/ui';
import { createId } from '@/src/lib/ids';
import { formatMoney } from '@/src/lib/money';
import { fetchPropertyValuation } from '@/src/lib/valuation';
import { useAppStore } from '@/src/store/appStore';
import type { Property, PropertyValuation } from '@/src/types';

export function PropertyForm({ initial }: { initial?: Property }) {
  const upsertProperty = useAppStore((state) => state.upsertProperty);
  const [name, setName] = useState(initial?.name ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [occupancy, setOccupancy] = useState<Property['occupancy']>(initial?.occupancy ?? 'rental');
  const [marketValue, setMarketValue] = useState(String(initial?.marketValue ?? ''));
  const [mortgageBalance, setMortgageBalance] = useState(String(initial?.mortgageBalance ?? ''));
  const [monthlyMortgagePayment, setMonthlyMortgagePayment] = useState(
    String(initial?.monthlyMortgagePayment ?? ''),
  );
  const [monthlyRent, setMonthlyRent] = useState(String(initial?.monthlyRent ?? ''));
  const [monthlyExpenses, setMonthlyExpenses] = useState(String(initial?.monthlyExpenses ?? ''));
  const [vacancyRate, setVacancyRate] = useState(
    String(initial ? Math.round(initial.vacancyRate * 100) : '5'),
  );
  const [purchasePrice, setPurchasePrice] = useState(String(initial?.purchasePrice ?? ''));
  const [units, setUnits] = useState(String(initial?.units ?? '1'));
  const [estimate, setEstimate] = useState<PropertyValuation | undefined>(initial?.lastEstimate);
  const [lookingUp, setLookingUp] = useState(false);

  function save() {
    const parsedValue = Number(marketValue);
    if (!name.trim() || Number.isNaN(parsedValue)) {
      Alert.alert('Missing details', 'A name and market value are required.');
      return;
    }
    upsertProperty({
      id: initial?.id ?? createId('prop'),
      name: name.trim(),
      address: address.trim(),
      occupancy,
      marketValue: parsedValue,
      mortgageBalance: Number(mortgageBalance) || 0,
      monthlyMortgagePayment: Number(monthlyMortgagePayment) || 0,
      monthlyRent: Number(monthlyRent) || 0,
      monthlyExpenses: Number(monthlyExpenses) || 0,
      vacancyRate: (Number(vacancyRate) || 0) / 100,
      purchasePrice: Number(purchasePrice) || parsedValue,
      units: Math.max(1, Number(units) || 1),
      tenants: initial?.tenants ?? [],
      purchaseDate: initial?.purchaseDate,
      mortgageRate: initial?.mortgageRate,
      lastEstimate: estimate,
    });
    router.back();
  }

  async function lookupEstimate() {
    setLookingUp(true);
    try {
      const next = await fetchPropertyValuation(address);
      setEstimate(next);
    } catch (error) {
      Alert.alert('Lookup failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLookingUp(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 40 }}>
        <Field label="Name" value={name} onChangeText={setName} />
        <Field
          label="Address"
          value={address}
          onChangeText={setAddress}
          placeholder="Street, City, State, ZIP"
        />
        <PrimaryButton
          label={lookingUp ? 'Looking up…' : 'Look up estimated value'}
          onPress={lookupEstimate}
          disabled={lookingUp}
        />
        {estimate ? (
          <Muted>
            {estimate.source}: {formatMoney(estimate.estimatedValue)}
            {estimate.rangeLow && estimate.rangeHigh
              ? ` (${formatMoney(estimate.rangeLow)}–${formatMoney(estimate.rangeHigh)})`
              : ''}
            {estimate.mock ? ' · mock (no RentCast key)' : ''}
          </Muted>
        ) : null}
        {estimate ? (
          <PrimaryButton
            label="Use estimate as market value"
            onPress={() => setMarketValue(String(estimate.estimatedValue))}
          />
        ) : null}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label="Rental" active={occupancy === 'rental'} onPress={() => setOccupancy('rental')} />
          <Chip
            label="Owner-occupied"
            active={occupancy === 'owner'}
            onPress={() => setOccupancy('owner')}
          />
        </View>
        <Field label="Market value" value={marketValue} onChangeText={setMarketValue} keyboardType="decimal-pad" />
        <Field
          label="Mortgage balance"
          value={mortgageBalance}
          onChangeText={setMortgageBalance}
          keyboardType="decimal-pad"
        />
        <Field
          label="Monthly mortgage"
          value={monthlyMortgagePayment}
          onChangeText={setMonthlyMortgagePayment}
          keyboardType="decimal-pad"
        />
        <Field label="Scheduled monthly rent" value={monthlyRent} onChangeText={setMonthlyRent} keyboardType="decimal-pad" />
        <Field
          label="Monthly expenses (ex-mortgage)"
          value={monthlyExpenses}
          onChangeText={setMonthlyExpenses}
          keyboardType="decimal-pad"
        />
        <Field
          label="Vacancy rate %"
          value={vacancyRate}
          onChangeText={setVacancyRate}
          keyboardType="decimal-pad"
        />
        <Field
          label="Purchase price"
          value={purchasePrice}
          onChangeText={setPurchasePrice}
          keyboardType="decimal-pad"
        />
        <Field label="Units" value={units} onChangeText={setUnits} keyboardType="numeric" />
        <PrimaryButton label="Save property" onPress={save} />
      </ScrollView>
    </Screen>
  );
}
