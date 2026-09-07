import { helperBaseUrl, normalizeHelperUrl } from '@/src/lib/helper';
import { createId } from '@/src/lib/ids';
import type { Account, PlaidConnection, Transaction } from '@/src/types';

export function normalizePlaidServerUrl(url?: string | null): string {
  return normalizeHelperUrl(url);
}

export const PLAID_SERVER_URL = helperBaseUrl();

export function isPlaidServerConfigured(url: string = PLAID_SERVER_URL): boolean {
  return normalizePlaidServerUrl(url).length > 0;
}

export interface PlaidHealth {
  ok: boolean;
  mock: boolean;
  mode?: 'mock' | 'sandbox' | 'production';
  env?: string;
  defaultEnv?: string;
  reason?: string;
  storesAccessTokens?: string;
}

export interface PlaidSnapshot {
  item: PlaidConnection;
  accounts: Account[];
  transactions: Transaction[];
}

export type ClientDataMode = 'demo' | 'helper-mock' | 'sandbox' | 'production' | 'linked';

export interface ConnectionStatus {
  mode: ClientDataMode;
  title: string;
  detail: string;
}

/**
 * Demo/fixture is the default when the helper URL or secrets are missing.
 * "Linked" means at least one real Plaid item was imported (source === 'plaid').
 */
export function describeConnectionStatus(input: {
  serverConfigured: boolean;
  health?: PlaidHealth | null;
  liveItemCount: number;
}): ConnectionStatus {
  if (input.liveItemCount > 0) {
    return {
      mode: 'linked',
      title: 'Linked',
      detail: `${input.liveItemCount} Plaid item(s) imported. Access tokens stay on the helper server — never in this app.`,
    };
  }

  if (!input.serverConfigured) {
    return {
      mode: 'demo',
      title: 'Demo mode',
      detail:
        'No helper URL is set. The app uses on-device fixtures (Chase / Ally / Amex / Fidelity). Leave EXPO_PUBLIC_PLAID_SERVER_URL empty to stay here.',
    };
  }

  const health = input.health;
  if (!health || health.mock || !health.ok) {
    return {
      mode: 'helper-mock',
      title: 'Demo mode',
      detail:
        health?.reason ??
        'Helper URL is set, but the server is in mock mode or unreachable. Fixtures still work. Add PLAID_CLIENT_ID and PLAID_SECRET on the server to enable sandbox Link.',
    };
  }

  if (health.env === 'production' || health.mode === 'production') {
    return {
      mode: 'production',
      title: 'Plaid production ready',
      detail: 'Helper is live on production keys. Open Link only after you intend to connect real institutions.',
    };
  }

  return {
    mode: 'sandbox',
    title: 'Sandbox ready',
    detail: 'Helper is live with Plaid sandbox keys. Open Link to connect First Platypus Bank (and other sandbox institutions), then import.',
  };
}

export async function fetchPlaidHealth(baseUrl: string = PLAID_SERVER_URL): Promise<PlaidHealth> {
  const url = normalizePlaidServerUrl(baseUrl);
  if (!url) {
    return { ok: false, mock: true, mode: 'mock', reason: 'No EXPO_PUBLIC_PLAID_SERVER_URL' };
  }
  try {
    const response = await fetch(`${url}/health`);
    if (!response.ok) {
      return { ok: false, mock: true, mode: 'mock', reason: `Server ${response.status}` };
    }
    return (await response.json()) as PlaidHealth;
  } catch {
    return { ok: false, mock: true, mode: 'mock', reason: 'Server unreachable' };
  }
}

export function plaidLinkUrl(baseUrl: string = PLAID_SERVER_URL): string {
  return `${normalizePlaidServerUrl(baseUrl)}/link`;
}

export async function fetchPlaidItems(
  baseUrl: string = PLAID_SERVER_URL,
): Promise<{ itemId: string; createdAt?: string }[]> {
  const response = await fetch(`${normalizePlaidServerUrl(baseUrl)}/items`);
  if (!response.ok) {
    throw new Error('Unable to list Plaid items');
  }
  const body = (await response.json()) as { items?: { itemId: string; createdAt?: string }[] };
  return body.items ?? [];
}

export async function fetchPlaidSnapshot(
  itemId: string,
  baseUrl: string = PLAID_SERVER_URL,
): Promise<PlaidSnapshot> {
  const response = await fetch(
    `${normalizePlaidServerUrl(baseUrl)}/snapshot?item_id=${encodeURIComponent(itemId)}`,
  );
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

export function countLivePlaidItems(items: { source: PlaidConnection['source'] }[]): number {
  return items.filter((item) => item.source === 'plaid').length;
}
