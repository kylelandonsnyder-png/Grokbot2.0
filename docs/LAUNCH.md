# Grokbot launch checklist

Order of work: **Auth → Valuations → EAS / web → Plaid later**.

The Expo scaffold is on `main`. This repo has the config. You still create accounts and keys yourself — none of those secrets belong in git.

Stable app IDs (do not change after the first store listing):

| Platform | Field | Value |
| --- | --- | --- |
| iOS | `ios.bundleIdentifier` | `com.kylelandonsnyder.grokbot` |
| Android | `android.package` | `com.kylelandonsnyder.grokbot` |
| Expo slug | `expo.slug` | `grokbot` |

---

## 0. Already in the repo

- [x] Expo / Expo Router personal-finance app
- [x] Local demo (fixtures) with **Continue without an account**
- [x] Email/password auth + optional Google/Apple via **Supabase**
- [x] Postgres schema + RLS for user-owned finance data
- [x] RentCast valuations (mock when the key is missing)
- [x] `eas.json` profiles: `development`, `preview`, `production`
- [x] Web static export + EAS Hosting / Vercel / Netlify config
- [x] Plaid helper kept in `server/` but **not required** for launch

You do **not** need secrets in git to merge this.

---

## 1. What you must do yourself (accounts + money)

| Account | Cost | When |
| --- | --- | --- |
| [Supabase](https://supabase.com) | Free tier is enough | **Now** — signup / login / cloud DB |
| [RentCast](https://www.rentcast.io/api) | Free trial / paid after quota | **Now** — live home-value estimates |
| [Expo](https://expo.dev/signup) | Free to start | Packaged builds + Hosting |
| [Apple Developer Program](https://developer.apple.com/programs/) | **$99 / year** | TestFlight / App Store |
| [Google Play Console](https://play.google.com/console/signup) | **$25 one-time** | Play internal track |
| [Plaid Dashboard](https://dashboard.plaid.com/signup) | Free sandbox | **Later** — bank linking |
| Helper host (laptop now, tiny VPS later) | Varies | RentCast key + (later) Plaid secrets |

---

## 2. Local demo (no keys)

```bash
npm install
npx expo start
```

Press `w` for web. Leave `.env` missing. Settings shows **Local demo**. Budget / Real Estate still show fixtures. Valuations on a property use a labeled **RentCast (mock)** number.

**SDK 57 / Expo Go:** App Store Expo Go stops at SDK **54**. Do not use store Expo Go. Use web, a simulator, or an EAS development build (`expo-dev-client`).

---

## 3. Auth (do this next)

Preferred stack: **Supabase Auth + Postgres**. Details: [supabase/README.md](../supabase/README.md).

1. Create a Supabase project.
2. Copy Project URL + **anon** key into `.env`:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR_REF.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

3. Run [`supabase/migrations/20260907120000_init.sql`](../supabase/migrations/20260907120000_init.sql) in the SQL editor.
4. Authentication → Email: enable. Turn **Confirm email** off for local testing.
5. Restart Expo. Cold start goes to **Log in**.
6. Sign up with email/password, or tap **Continue without an account**.

Session restore uses AsyncStorage. Log out is in Settings.

Optional Google / Apple: enable the provider in Supabase, add client IDs, and add Redirect URLs (`http://localhost:8081`, `grokbot://`, your public web origin as `EXPO_PUBLIC_SITE_URL`). The in-app buttons call those providers; they fail with a clear error until the dashboard is set up.

New cloud accounts start **empty** (default categories only). Demo Chase fixtures are not uploaded.

---

## 4. Valuations (RentCast — Zillow-like, supported API)

Zillow has no simple public Zestimate API for typical apps. Do **not** scrape Zillow. This app uses **[RentCast AVM](https://developers.rentcast.io/reference/value-estimate)** (`GET /v1/avm/value`).

A Zillow partner / Bridge feed is a **future** option if you later get approved — not implemented here.

1. Create an API key at [rentcast.io/api](https://www.rentcast.io/api).
2. Put it **only** on the helper (never in the Expo app):

   ```
   RENTCAST_API_KEY=...
   EXPO_PUBLIC_HELPER_URL=http://localhost:8787
   ```

3. `npm install --prefix server && npm run server`
4. In the app: Real Estate → a property → **Refresh estimate**, or **Look up estimated value** on the add/edit form.
5. Market value stays yours. **Use estimate as market value** copies the AVM into the number used for equity / yield. You can still type a manual override.

No key / no helper URL → **mock** estimate (stable per address, labeled `RentCast (mock)`). Demo keeps working.

Last estimate (value, range, timestamp, source, address queried) is stored on the property and, when signed in, in `properties.last_estimate` + `property_valuations`.

---

## 5. EAS (Android + iOS)

```bash
npm i -g eas-cli
eas login
eas build:configure          # writes extra.eas.projectId — commit that, not credentials
eas build -p android --profile preview
eas build -p ios --profile preview
```

Profiles in `eas.json`: `development` (dev client), `preview` (internal; Android APK), `production` (store; Play submit defaults to **internal** + draft).

First cheap binary: Android preview. iOS store/TestFlight needs the $99 program.

Set `EXPO_PUBLIC_SUPABASE_*` (and helper URL if you want live AVM) as EAS environment variables so binaries are not stuck in demo. Never put `RENTCAST_API_KEY`, `PLAID_SECRET`, or the Supabase **service_role** key in EAS **public** env.

---

## 6. Web deploy

```bash
npm run export:web           # dist/
npm run deploy:web           # expo export --platform web && eas deploy
```

First EAS Hosting run asks for a subdomain → `https://<name>--xxxx.expo.app`. Production: `eas deploy --prod`.

Fallbacks: `vercel.json`, `netlify.toml`.

Point `EXPO_PUBLIC_SITE_URL` at the public origin if you use Google/Apple on web.

---

## 7. Privacy / security

- Email/password (and optional OAuth) via Supabase. RLS: `auth.uid() = user_id`.
- Anon key is public by design. Service role stays in the Supabase dashboard.
- RentCast and (later) Plaid secrets live only on the helper.
- Helper `/health` never echoes secrets.
- Write a short privacy policy before stores: accounts on Supabase, valuations via RentCast, bank linking later via Plaid, delete = log out + delete the Supabase user / uninstall.
- Host the helper on HTTPS before a public binary uses it.
- AsyncStorage is a cache, not encryption.

---

## 8. Plaid — later

Bank linking is **not** on the critical path. The helper and Settings copy are still there.

When you want it: sandbox keys → `PLAID_ENV=sandbox` → `npm run server` → set helper URL → Settings → Manage connections. Access tokens stay in `server/data/items.json`. Production is an explicit key swap after Plaid approves you. Full leftover notes are in the README.

---

## 9. Suggested order

1. Merge this PR. `npm test` and `npm run typecheck`.
2. Use the local demo (no `.env`). Confirm Settings → Local demo and a mock estimate on Real Estate.
3. Create Supabase. Run the SQL. Sign up. Confirm a new account starts empty and survives reload.
4. Create a RentCast key. Run the helper. Refresh an estimate. Override market value by hand.
5. `eas login` → `eas build:configure` → Android preview + `npm run deploy:web`.
6. Apple / Play when you want TestFlight / internal track.
7. Plaid only after the above is boring.

---

## 10. Command cheat sheet

```bash
npm test
npm run typecheck
npx expo start
npm run web
npm install --prefix server && npm run server
curl -s http://localhost:8787/health
npm run export:web
npm run deploy:web
npm i -g eas-cli && eas login && eas build:configure
eas build -p android --profile preview
eas build -p ios --profile preview
```
