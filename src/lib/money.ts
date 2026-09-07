const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const usdExact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number, exact = false): string {
  const formatter = exact ? usdExact : usd;
  const abs = formatter.format(Math.abs(value));
  if (value < 0) return `-${abs}`;
  return abs;
}

export function formatSignedMoney(value: number, exact = true): string {
  const formatted = formatMoney(Math.abs(value), exact);
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function sumBy<T>(items: T[], pick: (item: T) => number): number {
  return items.reduce((total, item) => total + pick(item), 0);
}
