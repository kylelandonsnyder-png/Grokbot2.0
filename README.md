# Grokbot

Personal finance app for **web, iOS, and Android**. Built with **Expo SDK 57 / React Native** and **Expo Router**.

Grokbot plans a month as **income − fixed costs → discretionary leftover**, shows categorized spending, tracks net worth (cash, investments, retirement, other debts), and keeps a light real-estate portfolio with vacancy, tenants, profit, ROI, and monthly return.

Going from this demo to a public URL and store binaries? Follow **[docs/LAUNCH.md](docs/LAUNCH.md)** (accounts, EAS, TestFlight, Play internal, Plaid sandbox → production, privacy).

Stable package IDs (also in `app.json`):

- iOS `bundleIdentifier`: `com.kylelandonsnyder.grokbot`
- Android `package`: `com.kylelandonsnyder.grokbot`

## What v1 includes

- Four tabs: **Budget**, **Transactions**, **Overview**, **Real Estate**
- **Local-only data** on the device (Zustand + AsyncStorage). No cloud auth or sync.
- Plaid **sandbox** path with a tiny helper server for token exchange, plus **mock/fixture mode** when Plaid env is missing
- Merchant rules, editable categories, transfers excluded from spend
- Optional Expo Notifications for new transactions (the app runs fine if push is not configured)
- EAS Build profiles (`development` / `preview` / `production`) and a static web export

## Run the app (local demo)

No secrets required. Leave `.env` missing, or copy `.env.example` and keep `EXPO_PUBLIC_PLAID_SERVER_URL` empty.

```bash
npm install
npx expo start
```

Then open iOS Simulator, Android emulator, or press `w` for web.

```bash
npm run ios
npm run android
npm run web
```

Typecheck and checks:

```bash
npm run typecheck
npm test
```

### SDK 57 and Expo Go

This app is SDK **57**. **App Store Expo Go stops at SDK 54**, so a store-installed Expo Go on iPhone cannot open this project. Play Store Expo Go can lag too.

Do not use store Expo Go for packaging. Use:

- Web, or a simulator/emulator (CLI can fetch a matching Expo Go)
- A **development build** (`expo-dev-client` + `eas build -p ios|android --profile development`)

See [docs/LAUNCH.md](docs/LAUNCH.md) §2.

## Environment variables

Copy `.env.example` to `.env`. **Do not commit secrets.**

| Variable | Where | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_PLAID_SERVER_URL` | Expo app | Helper base URL. **Leave empty** to stay in demo/fixture mode. |
| `PLAID_CLIENT_ID` | Helper server only | Plaid dashboard client id |
| `PLAID_SECRET` | Helper server only | Sandbox secret first — never in the Expo app |
| `PLAID_ENV` | Helper server only | `sandbox` (default) or `production`. Anything else falls back to sandbox. |
| `PORT` | Helper server | Defaults to `8787` |

Restart Expo after changing any `EXPO_PUBLIC_*` value.

On a physical phone, `localhost` is the phone itself. Use your computer’s LAN IP, e.g. `http://192.168.1.20:8787`. Android emulator often needs `http://10.0.2.2:8787`.

## Plaid (sandbox is the default path out of fixtures)

1. Create a [Plaid](https://dashboard.plaid.com/) account and **sandbox** keys.
2. Put `PLAID_CLIENT_ID` and `PLAID_SECRET` in `.env`. Leave `PLAID_ENV=sandbox`.
3. Install and start the helper:

```bash
cd server
npm install
npm start
```

Or from the repo root: `npm run server`. Confirm:

```bash
curl -s http://localhost:8787/health
# keys missing → "mode": "mock"     (app stays on fixtures)
# keys present → "mode": "sandbox"
```

4. Set `EXPO_PUBLIC_PLAID_SERVER_URL=http://localhost:8787` and restart Expo.
5. In the app: **Settings → Manage connections → Open Plaid Link**.

The helper (`server/index.js`) creates a Link token, hosts Plaid Link, and exchanges the public token. **Access tokens are written only to `server/data/items.json` (gitignored) and are never sent back as a raw token for the client to persist.** The client receives accounts and transactions only. Posting an `access_token` to the helper is rejected.

Requested products: **transactions** (depository / credit), **liabilities** (loans / cards), **investments** (brokerage / 401k / retirement).

Settings shows **Demo mode** vs **Linked** (and **Sandbox ready** when the helper is live but nothing is imported yet).

### Production key swap

When you are ready to leave sandbox:

1. Create production keys in the Plaid dashboard and request the same products.
2. Set `PLAID_ENV=production` and replace `PLAID_SECRET` with the production secret.
3. Keep token exchange on a server you control (HTTPS). Do not put the secret in the Expo app or in EAS public env.
4. Rebuild with EAS so `EXPO_PUBLIC_PLAID_SERVER_URL` points at that host.

If Plaid env or the helper is missing, the UI stays demoable with on-device fixtures (Chase / Ally / Amex / Fidelity / loans / rentals).

## Packaged Android + iOS (EAS)

`eas.json` already defines `development`, `preview`, and `production`. You still need an Expo account; iOS store/TestFlight also needs Apple’s $99 program.

```bash
npm i -g eas-cli
eas login
eas build:configure          # writes extra.eas.projectId — commit that, not credentials
eas build -p android --profile preview
eas build -p ios --profile preview
```

Preview Android is an **APK** (easy sideload). Production Android is an **AAB** aimed at Play’s **internal** track (`eas submit -p android`). iOS production goes to TestFlight / App Store (`eas submit -p ios`).

Full checklist: [docs/LAUNCH.md](docs/LAUNCH.md) §4.

## Web deploy

Static export (already configured):

```bash
npm run export:web
# ./dist
```

**One-liner to a public URL** (EAS Hosting, preferred):

```bash
npm run deploy:web
# npx expo export --platform web && eas deploy
```

First run asks for a preview subdomain → `https://<name>--xxxx.expo.app`. Production: `eas deploy --prod`.

Fallbacks: `vercel.json` (Vercel) and `netlify.toml` (Netlify). Import the GitHub repo or run `npx vercel` / `npx netlify deploy --prod --dir=dist`.

## Budget model

Primary Budget framing:

```
discretionary leftover = planned income − planned fixed costs
discretionary remaining = leftover − discretionary spend this month
```

Category actuals are secondary. Transfers (card payments, 401(k) sweeps, savings moves) are tagged and **do not inflate spend**.

## Real estate

Each property tracks market value vs mortgage (equity), scheduled rent, operating expenses, mortgage payment, vacancy rate, and light tenant records. Metrics:

- Effective rent = scheduled rent × (1 − vacancy)
- Monthly profit = effective rent − expenses − mortgage
- Monthly return = profit / market value
- ROI on equity = annual cash flow / equity

Owner-occupied homes contribute equity to net worth without a rental yield.

## Notifications

Expo Notifications is wired for optional local alerts after a sync adds transactions. Permission failures and missing push config are ignored so the rest of the app keeps working.

## Project layout

```
app/                 Expo Router screens and tabs
src/lib/             Budget, net worth, retirement, real-estate math
src/store/           Local Zustand store
src/data/fixtures.ts Demo institutions and activity
server/              Plaid token-exchange helper (sandbox default)
docs/LAUNCH.md       Store / EAS / web / Plaid / privacy checklist
eas.json             development / preview / production builds
```

## License

The Expo tabs template ships with the MIT license in `LICENSE`.
