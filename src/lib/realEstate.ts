import { sumBy } from '@/src/lib/money';
import type { Property, Tenant } from '@/src/types';

export interface PropertyMetrics {
  equity: number;
  scheduledRent: number;
  vacancyLoss: number;
  effectiveRent: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  tenantRent: number;
  noi: number;
  monthlyProfit: number;
  monthlyReturn: number;
  annualCashFlow: number;
  roiOnEquity: number;
  roiOnValue: number;
  capRate: number;
}

export function occupancyCounts(property: Property): {
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  tenantRent: number;
} {
  const currentTenants = property.tenants.filter((tenant) => tenant.status !== 'vacant');
  const occupiedUnits = Math.min(property.units, currentTenants.length);
  const vacantUnits = Math.max(0, property.units - occupiedUnits);
  const occupancyRate = property.units > 0 ? occupiedUnits / property.units : 0;
  const tenantRent = sumBy(currentTenants, (tenant: Tenant) => tenant.monthlyRent);
  return { occupiedUnits, vacantUnits, occupancyRate, tenantRent };
}

export function computePropertyMetrics(property: Property): PropertyMetrics {
  const { occupiedUnits, vacantUnits, occupancyRate, tenantRent } = occupancyCounts(property);
  const scheduledRent = property.occupancy === 'owner' ? 0 : property.monthlyRent;
  const vacancyLoss = scheduledRent * clampRate(property.vacancyRate);
  const effectiveRent = scheduledRent - vacancyLoss;
  const noi = effectiveRent - property.monthlyExpenses;
  const monthlyProfit = property.occupancy === 'owner' ? -property.monthlyExpenses - property.monthlyMortgagePayment : noi - property.monthlyMortgagePayment;
  const equity = property.marketValue - property.mortgageBalance;
  const annualCashFlow = monthlyProfit * 12;
  const monthlyReturn = property.marketValue > 0 ? monthlyProfit / property.marketValue : 0;
  const roiOnEquity = equity > 0 ? annualCashFlow / equity : 0;
  const roiOnValue = property.marketValue > 0 ? annualCashFlow / property.marketValue : 0;
  const capRate = property.marketValue > 0 ? (noi * 12) / property.marketValue : 0;

  return {
    equity,
    scheduledRent,
    vacancyLoss,
    effectiveRent,
    occupiedUnits,
    vacantUnits,
    occupancyRate,
    tenantRent,
    noi,
    monthlyProfit,
    monthlyReturn,
    annualCashFlow,
    roiOnEquity,
    roiOnValue,
    capRate,
  };
}

export function computePortfolioMetrics(properties: Property[]) {
  const rows = properties.map((property) => ({
    property,
    metrics: computePropertyMetrics(property),
  }));
  const rentals = rows.filter((row) => row.property.occupancy === 'rental');

  return {
    rows,
    totalValue: sumBy(properties, (item) => item.marketValue),
    totalMortgage: sumBy(properties, (item) => item.mortgageBalance),
    totalEquity: sumBy(rows, (row) => row.metrics.equity),
    monthlyProfit: sumBy(rentals, (row) => row.metrics.monthlyProfit),
    monthlyRent: sumBy(rentals, (row) => row.metrics.effectiveRent),
  };
}

function clampRate(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
