import { useEffect } from 'react';

import { getSupabase, isSupabaseConfigured } from '@/src/lib/supabase';
import { useAppStore } from '@/src/store/appStore';
import { useAuthStore } from '@/src/store/authStore';

export function useAuthSession() {
  const setSession = useAuthStore((state) => state.setSession);
  const setReady = useAuthStore((state) => state.setReady);
  const continueAsDemo = useAuthStore((state) => state.continueAsDemo);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      continueAsDemo();
      setSession(null);
      setReady(true);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setReady(true);
      return;
    }

    let cancelled = false;
    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setReady(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [continueAsDemo, setReady, setSession]);
}

export function useSignOutAndReset() {
  const signOut = useAuthStore((state) => state.signOut);
  const resetToDemo = useAppStore((state) => state.resetToDemo);
  return async () => {
    await signOut();
    resetToDemo();
  };
}
