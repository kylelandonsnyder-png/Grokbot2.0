import { Link, Stack } from 'expo-router';

import { Muted, Screen, Title } from '@/src/components/ui';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Missing' }} />
      <Screen style={{ padding: 20, gap: 12, justifyContent: 'center' }}>
        <Title>Screen not found</Title>
        <Link href="/">
          <Muted>Go back to Budget</Muted>
        </Link>
      </Screen>
    </>
  );
}
