# Grokbot launch checklist

This is the “demo → packaged web + Android + iOS” list. The Expo scaffold is already on `main`. This repo has the **config and docs**. You still have to create paid store accounts, an Expo project, and Plaid keys — none of those secrets belong in git.

Stable app IDs (do not change after the first store listing):

| Platform | Field | Value |
| --- | --- | --- |
| iOS | `ios.bundleIdentifier` | `com.kylelandonsnyder.grokbot` |
| Android | `android.package` | `com.kylelandonsnyder.grokbot` |
| Expo slug | `expo.slug` | `grokbot` |

---

## 0. What is already done

- [x] Expo / Expo Router personal-finance scaffold merged to `main`
- [x] Local-only demo (fixtures) works with no `.env`
- [x] Plaid helper at `server/` with sandbox default + `/health`
- [x] `eas.json` profiles: `development`, `preview`, `production`
- [x] Web static export (`expo.web.output` = `static`) + Vercel / Netlify config
- [x] `.env.example` lists every variable; `.gitignore` blocks `.env`, tokens, keystores

You do **not** need secrets in this repo to merge this work.

---

## 1. What you must do yourself (accounts + money)

These cannot be done from a pull request:

| Account | Cost | Why |
| --- | --- | --- |
| [Expo](https://expo.dev/signup) | Free to start | EAS Build, credentials, Hosting |
| [Apple Developer Program](https://developer.apple.com/programs/) | **$99 / year** | iOS device builds, TestFlight, App Store |
| [Google Play Console](https://play.google.com/console/signup) | **$25 one-time** | Android internal track + Play Store |
| [Plaid Dashboard](https://dashboard.plaid.com/signup) | Free sandbox; production is an application | Bank Link keys |
| A machine you control for the helper (laptop now, a small VPS later) | Varies | Token exchange. **Never** put `PLAID_SECRET` in the Expo app |

Optional later: a privacy-policy URL (stores and Plaid will ask), custom domain, paid EAS plan if free build minutes run out.

---

## 2. Keep using the local demo (no keys)

```bash
npm install
npx expo start
```

Press `w` for web. Leave `.env` missing or copy `.env.example` and keep `EXPO_PUBLIC_PLAID_SERVER_URL` **empty**.

Settings should say **Demo mode**. Budget / Transactions still show Chase / Ally / Amex / Fidelity fixtures. Do not wait on Plaid or EAS to use the app locally.

**SDK 57 / Expo Go mismatch:** this project is Expo SDK **57**. Apple App Store Expo Go stops at SDK **54**. A store-installed Expo Go on iPhone **cannot** open this app. Play Store Expo Go can also lag. Do **not** plan a launch path around store Expo Go.

Use instead:

- Web (`npx expo start --web` or `npm run export:web`)
- iOS Simulator / Android emulator (CLI can install a matching Expo Go)
- A **development build** via EAS (`expo-dev-client` is in `package.json`)

---

## 3. Plaid: sandbox first, production later

Default path: **fixtures → sandbox**. Production is a later, explicit swap.

### Sandbox (do this first)

1. Create a Plaid account and open **Team Settings → Keys**. Copy the **sandbox** `client_id` and `secret`.
2. Request products you already use in code: **transactions**, **investments**, **liabilities**.
3. From the repo root:

   ```bash
   cp .env.example .env
   ```

   Fill only:

   ```
   PLAID_CLIENT_ID=...
   PLAID_SECRET=...          # sandbox secret
   PLAID_ENV=sandbox
   EXPO_PUBLIC_PLAID_SERVER_URL=http://localhost:8787
   ```

   On a physical phone use your LAN IP (`http://192.168.x.x:8787`). Android emulator often needs `http://10.0.2.2:8787`.

4. Start the helper, then the app (two terminals):

   ```bash
   npm install --prefix server
   npm run server
   # GET http://localhost:8787/health  →  "mode": "sandbox" when keys are present
   #                                   →  "mode": "mock"    when keys are missing

   npx expo start
   ```

5. In the app: **Settings → Manage connections → Open Plaid Link**. Use a [sandbox institution](https://plaid.com/docs/sandbox/test-credentials/) (e.g. First Platypus Bank). Then **Import from helper**.

Access tokens are written only to `server/data/items.json` (gitignored). The client receives accounts + transactions, never a raw access token.

If keys or the helper URL are missing, the UI stays on fixtures. That is intentional.

### Production key swap (only when Plaid approves you)

1. Apply for Production in the Plaid dashboard (same products).
2. Replace `PLAID_SECRET` with the **production** secret.
3. Set `PLAID_ENV=production`.
4. Host the helper on HTTPS you control. Point `EXPO_PUBLIC_PLAID_SERVER_URL` at that URL (this value is baked into EAS binaries at build time).
5. Rebuild the app (`preview` or `production` profile). Do not put the secret in EAS **public** env or `app.json`.

---

## 4. EAS project, credentials, first packaged builds

Exact CLI sequence (run on your machine; you must be logged in):

```bash
npm i -g eas-cli
eas login
cd /path/to/Grokbot2.0
eas build:configure
```

`eas build:configure` creates / links the Expo project and writes `extra.eas.projectId` into `app.json`. **Commit that projectId** (it is not a secret). Do not commit keystores, `.p12`, `.p8`, or Play upload keys.

### Profiles (see `eas.json`)

| Profile | What you get | Who installs it |
| --- | --- | --- |
| `development` | Dev client (`expo-dev-client`) | You, while coding |
| `preview` | Internal binary (Android **APK**) | Testers, no store listing required |
| `production` | Store-signed (Android **AAB**, iOS IPA) | Play internal track / TestFlight / stores |

### First Android build (cheapest packaged binary)

No Apple fee required:

```bash
eas build -p android --profile preview
```

Install the APK from the Expo dashboard. For a Play **internal testing** track later:

```bash
eas build -p android --profile production
eas submit -p android --profile production
```

`eas.json` already targets Play **internal** + **draft**. You still have to create the Play app (`com.kylelandonsnyder.grokbot`), accept policies, and upload a privacy questionnaire.

### First iOS build (needs the $99 program)

```bash
eas build -p ios --profile preview
```

EAS can generate a distribution cert + provisioning profile and store them on Expo’s servers (you click through). Then:

```bash
eas build -p ios --profile production
eas submit -p ios --profile production
```

That lands a build in **App Store Connect → TestFlight**. You add testers, then submit for App Store review when ready.

On the first iOS production build, EAS will ask for your Apple team. Let EAS manage credentials unless you already have a cert workflow.

### Environment variables on EAS

- `EXPO_PUBLIC_PLAID_SERVER_URL` — set per environment in the Expo dashboard if a binary should Link. Empty = demo mode in that binary.
- `PLAID_CLIENT_ID` / `PLAID_SECRET` — **never** add these to the Expo app or to EAS public env. They belong only on the helper host.

---

## 5. Web deploy (public URL)

Web is already set to static Metro export (`app.json` → `expo.web.output: "static"`).

Confirm locally:

```bash
npm run export:web
# writes ./dist  (gitignored)
```

### Preferred one-liner: EAS Hosting

```bash
npm i -g eas-cli
eas login
npm run deploy:web
# same as: npx expo export --platform web && eas deploy
```

First run asks you to pick a preview subdomain. You get a URL like `https://<subdomain>--xxxx.expo.app/`. Production:

```bash
npx expo export --platform web && eas deploy --prod
# https://<subdomain>.expo.app
```

### Fallback: Vercel

This repo includes `vercel.json` (`buildCommand` + `outputDirectory: dist`).

```bash
npx vercel
```

Or import the GitHub repo in the Vercel dashboard. Framework: **Other**. Output: `dist`.

### Fallback: Netlify

`netlify.toml` is included.

```bash
npx netlify deploy --prod --dir=dist
```

(after `npm run export:web`)

Do not point a public web build at `http://localhost:8787`. Either leave the helper URL empty (demo) or use an HTTPS helper.

---

## 6. Privacy / security notes (finance app)

Treat this as money software even while it is a personal project.

**Already true in this repo**

- No cloud auth or sync. Data lives in AsyncStorage on the device / browser.
- Plaid access tokens never leave `server/data/items.json`.
- `.env`, keystores, and `server/data/*.json` are gitignored.
- Helper `/health` reports mode (`mock` / `sandbox` / `production`) and never echoes secrets.
- Client rejects “I will just store the access token” — the exchange API 400s if a client posts `access_token`.

**You must still do**

- [ ] Write a short **privacy policy** before Play / App Store / Plaid production (what you collect, that bank creds go to Plaid not you, how to delete data: Settings → Reset demo data / uninstall).
- [ ] Host the helper on **HTTPS**. Do not expose it to the open internet without a shared secret or auth in front.
- [ ] Do not log raw transactions, names, or tokens in production.
- [ ] Do not add analytics SDKs that upload account balances without a review.
- [ ] AsyncStorage is **not** encrypted. That is acceptable for a local demo; before you store real balances on a shared phone, plan SecureStore / device passcode.
- [ ] App Store export compliance: `ITSAppUsesNonExemptEncryption` is `false` (HTTPS / OS crypto only). Revisit if you add your own encryption.
- [ ] Play Data safety + iOS App Privacy nutrition labels: you collect financial info **on device**; bank linking is via Plaid.

**Plaid production extras:** complete their security questionnaire, use webhook verification if you add webhooks, rotate secrets if they leak.

---

## 7. Suggested order this week

1. Merge this PR. Confirm `npm test` and `npm run typecheck` on `main`.
2. Run the local demo. Confirm Settings shows **Demo mode**.
3. Create Expo + Plaid (sandbox) accounts. Optional: run the helper and Link once.
4. `eas login` → `eas build:configure` → commit the new `projectId`.
5. `eas build -p android --profile preview` (first packaged binary).
6. `npm run deploy:web` for a public URL.
7. When you want TestFlight / Play internal: pay Apple / Google, then `production` profile + `eas submit`.
8. Only after sandbox Link is boringly reliable: apply for Plaid production.

---

## 8. Command cheat sheet

```bash
# Quality
npm test
npm run typecheck

# Demo
npx expo start
npm run web

# Helper
npm install --prefix server
npm run server
curl -s http://localhost:8787/health

# Web package
npm run export:web
npm run deploy:web          # EAS Hosting

# Native package
npm i -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
eas build -p ios --profile preview
eas build -p android --profile production
eas build -p ios --profile production
eas submit -p android --profile production
eas submit -p ios --profile production
```
