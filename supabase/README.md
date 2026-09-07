# Supabase setup (auth + Postgres)

1. Create a project at [supabase.com](https://supabase.com).
2. Project Settings → API: copy **Project URL** and **anon public** key into `.env` as `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Never commit the **service_role** key.
3. SQL Editor: paste and run [`migrations/20260907120000_init.sql`](migrations/20260907120000_init.sql).
4. Authentication → Providers → Email: enable. For local testing, turn **off** “Confirm email”.
5. Optional Google / Apple: enable the provider, add Client IDs, and add Redirect URLs:
   - `http://localhost:8081`
   - `grokbot://`
   - your EAS Hosting / Vercel origin (`EXPO_PUBLIC_SITE_URL`)
6. Restart Expo after changing `EXPO_PUBLIC_*` values.

New accounts start empty (default categories only) and sync through RLS (`auth.uid() = user_id`). “Continue without an account” stays local and does not upload demo Chase fixtures.
