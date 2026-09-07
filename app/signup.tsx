import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { Card, Field, GhostButton, Muted, PrimaryButton, Screen, Title } from '@/src/components/ui';
import { isSupabaseConfigured } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/store/authStore';

export default function SignupScreen() {
  const signUp = useAuthStore((state) => state.signUp);
  const continueAsDemo = useAuthStore((state) => state.continueAsDemo);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const configured = isSupabaseConfigured();

  async function submit() {
    if (!email.trim() || password.length < 6) {
      Alert.alert('Check the form', 'Use a real email and a password of at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      await signUp(email, password);
      Alert.alert(
        'Account created',
        'If the Supabase project requires email confirmation, check your inbox. Otherwise you are signed in.',
      );
      router.replace('/');
    } catch (error) {
      Alert.alert('Could not sign up', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingTop: 48 }}>
        <View>
          <Muted>Grokbot</Muted>
          <Title>Create account</Title>
        </View>
        <Card>
          <Muted>
            Email and password. New accounts start empty (categories only) and sync to Supabase when
            configured. Confirm-email can be turned off in Authentication → Providers → Email for local testing.
          </Muted>
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
          <PrimaryButton
            label={busy ? 'Creating…' : 'Sign up'}
            onPress={submit}
            disabled={busy || !configured}
          />
          <Link href="/login">
            <Muted style={{ textDecorationLine: 'underline' }}>Already have an account? Log in</Muted>
          </Link>
        </Card>
        <GhostButton
          label="Continue without an account"
          onPress={() => {
            continueAsDemo();
            router.replace('/');
          }}
        />
      </ScrollView>
    </Screen>
  );
}
