import assert from 'node:assert/strict';
import test from 'node:test';

import { isSupabaseConfigured, needsAuthScreen } from './env';

test('missing Supabase env keeps the app on the local demo path', () => {
  assert.equal(isSupabaseConfigured(), false);
  assert.equal(needsAuthScreen({ session: null, demoUnlocked: true }), false);
  assert.equal(needsAuthScreen({ session: null, demoUnlocked: false }), false);
});

test('configured + no session + not demo requires the login screen', () => {
  const previousUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'public-anon-key';
  try {
    assert.equal(isSupabaseConfigured(), true);
    assert.equal(needsAuthScreen({ session: null, demoUnlocked: false }), true);
    assert.equal(needsAuthScreen({ session: null, demoUnlocked: true }), false);
    assert.equal(needsAuthScreen({ session: { user: { id: 'u1' } }, demoUnlocked: false }), false);
  } finally {
    if (previousUrl === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    else process.env.EXPO_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = previousKey;
  }
});
