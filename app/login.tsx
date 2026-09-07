import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { Card, Field, GhostButton, Heading, Muted, PrimaryButton, Screen, Title } from '@/src/components/ui';
import { isSupabaseConfigured } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/store/authStore';

export default function LoginScreen() {
  const signIn = useAuthStore((state) => state.signIn);
  const signInSocial = useAuthStore((state) => state.signInSocial);
  const continueAsDemo = useAuthStore((state) => state.continueAsDemo);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const configured = isSupabaseConfigured();

  async function submit() {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Enter email and password.');
      return;
    }
    setBusy(true);
    try {
      await signIn(email, password);
      router.replace('/');
    } catch (error) {
      Alert.alert('Could not log in', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  async function social(provider: 'google' | 'apple') {
    setBusy(true);
    try {
      await signInSocial(provider);
      router.replace('/');
    } catch (error) {
      Alert.alert(
        'Social sign-in',
        error instanceof Error
          ? error.message
          : 'Enable this provider in the Supabase dashboard (Authentication → Providers).',
      );
    } finally {
      setBusy(false);
    }
  }

  function demo() {
    continueAsDemo();
    router.replace('/');
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingTop: 48 }}>
        <View>
          <Muted>Grokbot</Muted>
          <Title>Log in</Title>
        </View>
        <Card>
          {!configured ? (
            <Muted>
              Supabase is not configured. Copy EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
              from a new Supabase project into `.env`. Until then, continue with the local demo.
            </Muted>
          ) : (
            <Muted>Your budget, transactions, and properties sync to your account.</Muted>
          )}
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          <PrimaryButton label={busy ? 'Signing in…' : 'Log in'} onPress={submit} disabled={busy || !configured} />
          <PrimaryButton label="Continue with Google" onPress={() => social('google')} disabled={busy || !configured} />
          <PrimaryButton label="Continue with Apple" onPress={() => social('apple')} disabled={busy || !configured} />
          <Link href="/signup">
            <Muted style={{ textDecorationLine: 'underline' }}>Create an account</Muted>
          </Link>
        </Card>
        <Card>
          <Heading>Local demo</Heading>
          <Muted>
            No account required. Data stays on this device and uses fixture banks / properties. You can
            create an account later.
          </Muted>
          <GhostButton label="Continue without an account" onPress={demo} />
        </Card>
      </ScrollView>
    </Screen>
  );
}
