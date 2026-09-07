export function normalizeHelperUrl(url?: string | null): string {
  return url?.trim().replace(/\/$/, '') ?? '';
}

/** Shared local helper (valuations now; Plaid later). */
export function helperBaseUrl(): string {
  return normalizeHelperUrl(
    process.env.EXPO_PUBLIC_HELPER_URL || process.env.EXPO_PUBLIC_PLAID_SERVER_URL,
  );
}

export function isHelperConfigured(): boolean {
  return helperBaseUrl().length > 0;
}
