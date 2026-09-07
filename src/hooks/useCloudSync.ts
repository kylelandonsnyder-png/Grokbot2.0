import { useEffect, useRef } from 'react';

import { loadOrInitializeCloud, pushCloudSnapshot } from '@/src/lib/cloudSync';
import { isSupabaseConfigured } from '@/src/lib/supabase';
import { useAppStore } from '@/src/store/appStore';
import { useAuthStore } from '@/src/store/authStore';

export function useCloudSync() {
  const userId = useAuthStore((state) => state.session?.user.id);
  const hydrated = useAppStore((state) => state.hydrated);
  const pulling = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured() || !userId || !hydrated) return;
    let cancelled = false;
    pulling.current = true;
    void loadOrInitializeCloud(userId)
      .then((snapshot) => {
        if (cancelled) return;
        useAppStore.getState().replaceSnapshot(snapshot);
      })
      .catch((error) => {
        console.warn('Cloud pull failed', error);
      })
      .finally(() => {
        pulling.current = false;
      });

    const unsub = useAppStore.subscribe((state) => {
      if (cancelled || pulling.current || !userId) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const snap = {
          accounts: state.accounts,
          transactions: state.transactions,
          categories: state.categories,
          merchantRules: state.merchantRules,
          incomeSources: state.incomeSources,
          fixedExpenses: state.fixedExpenses,
          debts: state.debts,
          properties: state.properties,
          retirement: state.retirement,
          plaidItems: state.plaidItems,
          settings: state.settings,
        };
        void pushCloudSnapshot(userId, snap).catch((error) => {
          console.warn('Cloud push failed', error);
        });
      }, 800);
    });

    return () => {
      cancelled = true;
      unsub();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [hydrated, userId]);
}
