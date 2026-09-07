# Grokbot

Personal finance app for iOS and Android. Built with **Expo / React Native** and **Expo Router**.

Grokbot plans a month as **income − fixed costs → discretionary leftover**, shows categorized spending, tracks net worth (cash, investments, retirement, other debts), and keeps a light real-estate portfolio with vacancy, tenants, profit, ROI, and monthly return.

## What v1 includes

- Four tabs: **Budget**, **Transactions**, **Overview**, **Real Estate**
- **Local-only data** on the device (Zustand + AsyncStorage). No cloud auth or sync.
- Plaid sandbox path with a tiny helper server for token exchange, plus **mock/fixture mode** when Plaid env is missing
- Merchant rules, editable categories, transfers excluded from spend
- Optional Expo Notifications for new transactions (the app runs fine if push is not configured)

## Run the app

```bash
npm install
npx expo start
```

Then open iOS Simulator, Android emulator, Expo Go, or press `w` for web.

```bash
npm run ios
npm run android
npm run web
```

Typecheck and math checks:

```bash
npx tsc --noEmit
npm test
```

## Environment variables

Copy `.env.example` to `.env`. **Do not commit secrets.**

| Variable | Where | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_PLAID_SERVER_URL` | Expo app | Helper base URL. Leave empty to stay in mock mode. |
| `PLAID_CLIENT_ID` | Helper server | Plaid dashboard client id |
| `PLAID_SECRET` | Helper server | Sandbox secret first |
| `PLAID_ENV` | Helper server | `sandbox` (default) or `production` |
| `PORT` | Helper server | Defaults to `8787` |

Restart Expo after changing any `EXPO_PUBLIC_*` value.

On a physical phone, `localhost` is the phone itself. Use your computer’s LAN IP, e.g. `http://192.168.1.20:8787`. Android emulator often needs `http://10.0.2.2:8787`.

## Plaid (sandbox first)

1. Create a [Plaid](https://dashboard.plaid.com/) account and sandbox keys.
2. Put `PLAID_CLIENT_ID` and `PLAID_SECRET` in `.env`.
3. Install and start the helper:

```bash
cd server
npm install
npm start
```

4. Set `EXPO_PUBLIC_PLAID_SERVER_URL=http://localhost:8787` and restart Expo.
5. In the app: **Settings → Manage connections → Open Plaid Link**.

The helper (`server/index.js`) creates a Link token, hosts Plaid Link, and exchanges the public token. **Access tokens are written only to `server/data/items.json` (gitignored) and are never sent back as a raw token for the client to persist.** The client receives accounts and transactions only.

Requested products: **transactions** (depository / credit), **liabilities** (loans / cards), **investments** (brokerage / 401k / retirement).

### Production key swap

When you are ready to leave sandbox:

1. Create production keys in the Plaid dashboard and request the same products.
2. Set `PLAID_ENV=production` and replace `PLAID_SECRET` with the production secret.
3. Keep token exchange on a server you control. Do not put the secret in the Expo app.
4. Use a development build or production binary for Link on device; Expo Go is fine for mock mode.

If Plaid env or the helper is missing, the UI stays demoable with on-device fixtures (Chase / Ally / Amex / Fidelity / loans / rentals).

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
server/              Plaid token-exchange helper
```

## License

The Expo tabs template ships with the MIT license in `LICENSE`.
