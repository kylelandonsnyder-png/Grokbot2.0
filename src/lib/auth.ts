import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { getSupabase, isSupabaseConfigured } from '@/src/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export type AuthProvider = 'google' | 'apple';

export function authRedirectUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return process.env.EXPO_PUBLIC_SITE_URL?.replace(/\/$/, '') || window.location.origin;
  }
  return process.env.EXPO_PUBLIC_SITE_URL?.replace(/\/$/, '') || Linking.createURL('/');
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOutRemote() {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function signInWithProvider(provider: AuthProvider) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');
  const redirectTo = authRedirectUrl();

  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) throw error;
    return;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data.url) throw new Error('No OAuth URL returned. Enable this provider in the Supabase dashboard.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !('url' in result) || !result.url) {
    throw new Error('Sign-in was cancelled.');
  }

  const parsed = extractTokens(result.url);
  if (!parsed) {
    throw new Error('OAuth finished without tokens. Add this app URL to Supabase Redirect URLs.');
  }
  const { error: sessionError } = await supabase.auth.setSession(parsed);
  if (sessionError) throw sessionError;
}

function extractTokens(url: string): { access_token: string; refresh_token: string } | null {
  const hash = url.split('#')[1] ?? '';
  const search = url.split('?')[1]?.split('#')[0] ?? '';
  const params = new URLSearchParams(hash || search);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token };
}

export { isSupabaseConfigured };
