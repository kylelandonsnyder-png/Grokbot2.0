import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import {
  Card,
  Chip,
  Field,
  GhostButton,
  Heading,
  MoneyText,
  Muted,
  PrimaryButton,
  Row,
  Screen,
  SectionLabel,
} from '@/src/components/ui';
import { PropertyForm } from '@/src/components/PropertyForm';
import { useTheme } from '@/src/hooks/useTheme';
import { createId } from '@/src/lib/ids';
import { formatMoney, formatPercent } from '@/src/lib/money';
import { computePropertyMetrics } from '@/src/lib/realEstate';
import { useAppStore } from '@/src/store/appStore';
import type { Tenant } from '@/src/types';

export default function PropertyDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const property = useAppStore((state) => state.properties.find((item) => item.id === id));
  const upsertTenant = useAppStore((state) => state.upsertTenant);
  const removeTenant = useAppStore((state) => state.removeTenant);
  const removeProperty = useAppStore((state) => state.removeProperty);
  const [editing, setEditing] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [tenantUnit, setTenantUnit] = useState('');
  const [tenantRent, setTenantRent] = useState('');
  const [tenantStatus, setTenantStatus] = useState<Tenant['status']>('current');

  if (!property) {
    return (
      <Screen>
        <Muted style={{ padding: 20 }}>Property not found.</Muted>
      </Screen>
    );
  }

  if (editing) {
    return <PropertyForm initial={property} />;
  }

  const selected = property;
  const metrics = computePropertyMetrics(selected);

  function addTenant() {
    if (!tenantName.trim()) {
      Alert.alert('Tenant name required');
      return;
    }
    upsertTenant(selected.id, {
      id: createId('ten'),
      name: tenantName.trim(),
      unit: tenantUnit.trim() || undefined,
      monthlyRent: Number(tenantRent) || 0,
      status: tenantStatus,
    });
    setTenantName('');
    setTenantUnit('');
    setTenantRent('');
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 48 }}>
        <Card>
          <Heading>{property.name}</Heading>
          <Muted>{property.address}</Muted>
          <Row>
            <Muted>Market value</Muted>
            <MoneyText value={property.marketValue} size={18} />
          </Row>
          <Row>
            <Muted>Mortgage</Muted>
            <MoneyText value={-property.mortgageBalance} size={16} color={theme.danger} />
          </Row>
          <Row>
            <Muted>Equity</Muted>
            <MoneyText value={metrics.equity} size={16} color={theme.accent} />
          </Row>
        </Card>

        {property.occupancy === 'rental' ? (
          <Card>
            <SectionLabel>Rental math</SectionLabel>
            <Row>
              <Muted>Scheduled rent</Muted>
              <Muted>{formatMoney(metrics.scheduledRent)}</Muted>
            </Row>
            <Row>
              <Muted>Vacancy loss ({formatPercent(property.vacancyRate)})</Muted>
              <Muted>{formatMoney(-metrics.vacancyLoss)}</Muted>
            </Row>
            <Row>
              <Muted>Effective rent</Muted>
              <Muted>{formatMoney(metrics.effectiveRent)}</Muted>
            </Row>
            <Row>
              <Muted>Expenses</Muted>
              <Muted>{formatMoney(-property.monthlyExpenses)}</Muted>
            </Row>
            <Row>
              <Muted>Mortgage payment</Muted>
              <Muted>{formatMoney(-property.monthlyMortgagePayment)}</Muted>
            </Row>
            <Row>
              <Heading>Monthly profit</Heading>
              <MoneyText value={metrics.monthlyProfit} size={20} />
            </Row>
            <Row>
              <Muted>ROI on equity (annual)</Muted>
              <Muted>{formatPercent(metrics.roiOnEquity)}</Muted>
            </Row>
            <Row>
              <Muted>Monthly return on value</Muted>
              <Muted>{formatPercent(metrics.monthlyReturn, 2)}</Muted>
            </Row>
            <Row>
              <Muted>Cap rate</Muted>
              <Muted>{formatPercent(metrics.capRate)}</Muted>
            </Row>
          </Card>
        ) : (
          <Card>
            <Muted>Owner-occupied. Equity still counts toward net worth; no rental yield.</Muted>
          </Card>
        )}

        <Card>
          <SectionLabel>Tenants</SectionLabel>
          <Muted>
            {metrics.occupiedUnits} occupied · {metrics.vacantUnits} vacant · tenant rent{' '}
            {formatMoney(metrics.tenantRent)}
          </Muted>
          {selected.tenants.map((tenant) => (
            <Row key={tenant.id} onPress={() => removeTenant(selected.id, tenant.id)}>
              <View style={{ flex: 1 }}>
                <Heading>{tenant.name}</Heading>
                <Muted>
                  {tenant.unit ? `Unit ${tenant.unit} · ` : ''}
                  {tenant.status}
                  {tenant.leaseEnd ? ` · through ${tenant.leaseEnd}` : ''}
                </Muted>
              </View>
              <Muted>{formatMoney(tenant.monthlyRent)}</Muted>
            </Row>
          ))}
          <Field label="Tenant name" value={tenantName} onChangeText={setTenantName} />
          <Field label="Unit" value={tenantUnit} onChangeText={setTenantUnit} />
          <Field
            label="Monthly rent"
            value={tenantRent}
            onChangeText={setTenantRent}
            keyboardType="decimal-pad"
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['current', 'notice', 'vacant'] as Tenant['status'][]).map((status) => (
              <Chip
                key={status}
                label={status}
                active={tenantStatus === status}
                onPress={() => setTenantStatus(status)}
              />
            ))}
          </View>
          <PrimaryButton label="Add tenant" onPress={addTenant} />
          <Muted>Tap a tenant to remove. This is light occupancy tracking, not a full PMS.</Muted>
        </Card>

        <GhostButton label="Edit property details" onPress={() => setEditing(true)} />
        <GhostButton
          label="Delete property"
          onPress={() => {
            removeProperty(property.id);
            router.back();
          }}
        />
      </ScrollView>
    </Screen>
  );
}
