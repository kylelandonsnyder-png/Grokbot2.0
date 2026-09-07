import { Platform } from 'react-native';

export interface NotificationSetupResult {
  ok: boolean;
  reason?: string;
}

async function loadNotifications() {
  return import('expo-notifications');
}

export async function configureNotifications(): Promise<NotificationSetupResult> {
  if (Platform.OS === 'web') {
    return { ok: false, reason: 'web' };
  }

  try {
    const Notifications = await loadNotifications();
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') {
      return { ok: false, reason: 'denied' };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

export async function notifyNewTransactions(count: number): Promise<void> {
  if (count <= 0 || Platform.OS === 'web') return;
  try {
    const Notifications = await loadNotifications();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: count === 1 ? 'New transaction' : `${count} new transactions`,
        body: 'Open Grokbot to review and categorize them.',
      },
      trigger: null,
    });
  } catch {
    // Push / local notifications are optional and must not block the app.
  }
}
