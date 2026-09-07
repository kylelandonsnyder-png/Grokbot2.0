import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  signInWithEmail,
  signInWithProvider,
  signOutRemote,
  signUpWithEmail,
  type AuthProvider,
} from '@/src/lib/auth';
import { isSupabaseConfigured } from '@/src/lib/env';
import { getSupabase } from '@/src/lib/supabase';

interface AuthState {
  ready: boolean;
  session: Session | null;
  demoUnlocked: boolean;
  setReady: (value: boolean) => void;
  setSession: (session: Session | null) => void;
  continueAsDemo: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInSocial: (provider: AuthProvider) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ready: false,
      session: null,
      demoUnlocked: !isSupabaseConfigured(),
      setReady: (value) => set({ ready: value }),
      setSession: (session) => set({ session, demoUnlocked: session ? false : undefined }),
      continueAsDemo: () => set({ demoUnlocked: true }),
      signIn: async (email, password) => {
        const data = await signInWithEmail(email, password);
        set({ session: data.session, demoUnlocked: false });
      },
      signUp: async (email, password) => {
        const data = await signUpWithEmail(email, password);
        set({ session: data.session, demoUnlocked: false });
      },
      signInSocial: async (provider) => {
        await signInWithProvider(provider);
        const supabase = getSupabase();
        const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
        set({ session: data.session, demoUnlocked: Boolean(data.session) ? false : undefined });
      },
      signOut: async () => {
        await signOutRemote();
        set({ session: null, demoUnlocked: false });
      },
    }),
    {
      name: 'grokbot-auth-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ demoUnlocked: state.demoUnlocked }),
    },
  ),
);

export { needsAuthScreen } from '@/src/lib/env';
