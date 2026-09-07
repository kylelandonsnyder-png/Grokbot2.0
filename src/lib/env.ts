export function supabaseUrl(): string {
  return process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
}

export function supabaseAnonKey(): string {
  return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
}

export function isSupabaseConfigured(): boolean {
  return supabaseUrl().length > 0 && supabaseAnonKey().length > 0;
}

export function needsAuthScreen(state: { session: unknown; demoUnlocked: boolean }): boolean {
  if (!isSupabaseConfigured()) return false;
  return !state.session && !state.demoUnlocked;
}
