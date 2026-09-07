import { createId } from '@/src/lib/ids';
import type { Account, PlaidConnection, Transaction } from '@/src/types';

export const PLAID_SERVER_URL = process.env.EXPO_PUBLIC_PLAID_SERVER_URL?.replace(/\/$/, '') ?? '';

export function isPlaidServerConfigured(): boolean {
  return PLAID_SERVER_URL.length > 0;
}

export interface PlaidHealth {
  ok: boolean;
  mock: boolean;
  env?: string;
  reason?: string;
}

export interface PlaidSnapshot {
  item: PlaidConnection;
  accounts: Account[];
  transactions: Transaction[];
}

export async function fetchPlaidHealth(): Promise<PlaidHealth> {
  if (!isPlaidServerConfigured()) {
    return { ok: false, mock: true, reason: 'No EXPO_PUBLIC_PLAID_SERVER_URL' };
  }
  try {
    const response = await fetch(`${PLAID_SERVER_URL}/health`);
    if (!response.ok) {
      return { ok: false, mock: true, reason: `Server ${response.status}` };
    }
    return (await response.json()) as PlaidHealth;
  } catch {
    return { ok: false, mock: true, reason: 'Server unreachable' };
  }
}

export function plaidLinkUrl(): string {
  return `${PLAID_SERVER_URL}/link`;
}

export async function fetchPlaidItems(): Promise<{ itemId: string; createdAt?: string }[]> {
  const response = await fetch(`${PLAID_SERVER_URL}/items`);
  if (!response.ok) {
    throw new Error('Unable to list Plaid items');
  }
  const body = (await response.json()) as { items?: { itemId: string; createdAt?: string }[] };
  return body.items ?? [];
}

export async function fetchPlaidSnapshot(itemId: string): Promise<PlaidSnapshot> {
  const response = await fetch(`${PLAID_SERVER_URL}/snapshot?item_id=${encodeURIComponent(itemId)}`);
  if (!response.ok) {
    throw new Error('Unable to load Plaid snapshot');
  }
  return (await response.json()) as PlaidSnapshot;
}

export function buildMockConnection(institutionName: string): PlaidConnection {
  const id = createId('item');
  return {
    id,
    institutionName,
    itemId: id,
    products: ['transactions', 'investments', 'liabilities'],
    connectedAt: new Date().toISOString(),
    source: 'mock',
  };
}
