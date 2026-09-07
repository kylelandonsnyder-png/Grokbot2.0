'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const {
  resolvePlaidEnv,
  hasPlaidSecrets,
  buildHealthPayload,
  rejectClientAccessToken,
} = require('./plaidConfig');
const { estimateValue, hasRentcastKey } = require('./valuation');

const RENTCAST_API_KEY = process.env.RENTCAST_API_KEY || '';

const PORT = Number(process.env.PORT || 8787);
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || '';
const PLAID_SECRET = process.env.PLAID_SECRET || '';
const PLAID_ENV = resolvePlaidEnv(process.env.PLAID_ENV);
const DATA_DIR = path.join(__dirname, 'data');
const ITEMS_PATH = path.join(DATA_DIR, 'items.json');

const app = express();
app.use(cors());
app.use(express.json());

function secretsReady() {
  return hasPlaidSecrets(PLAID_CLIENT_ID, PLAID_SECRET);
}

function readItems() {
  try {
    return JSON.parse(fs.readFileSync(ITEMS_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function writeItems(items) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(ITEMS_PATH, JSON.stringify(items, null, 2));
}

function getPlaidClient() {
  if (!secretsReady()) {
    throw new Error('Plaid secrets missing');
  }
  const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
  const env = PlaidEnvironments[PLAID_ENV] || PlaidEnvironments.sandbox;
  return new PlaidApi(
    new Configuration({
      basePath: env,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': PLAID_CLIENT_ID,
          'PLAID-SECRET': PLAID_SECRET,
        },
      },
    }),
  );
}

app.get('/', (_req, res) => {
  res.json({
    name: 'Grokbot Plaid helper',
    health: '/health',
    link: '/link',
    defaultEnv: 'sandbox',
    env: PLAID_ENV,
    mock: !secretsReady(),
  });
});

app.get('/health', (_req, res) => {
  res.json({
    ...buildHealthPayload({
      clientId: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      env: PLAID_ENV,
    }),
    valuations: hasRentcastKey(RENTCAST_API_KEY) ? 'rentcast' : 'mock',
  });
});

app.post('/valuations/estimate', async (req, res) => {
  try {
    const result = await estimateValue({
      address: req.body?.address,
      apiKey: RENTCAST_API_KEY,
    });
    res.status(result.status).json(result.body);
  } catch (error) {
    res.status(500).json({ error: error.message || 'valuation failed' });
  }
});

app.post('/link/token/create', async (_req, res) => {
  if (!secretsReady()) {
    return res.status(503).json({ error: 'Plaid secrets missing', mock: true, env: PLAID_ENV });
  }
  try {
    const client = getPlaidClient();
    const response = await client.linkTokenCreate({
      user: { client_user_id: 'grokbot-local-user' },
      client_name: 'Grokbot',
      products: ['transactions', 'investments', 'liabilities'],
      country_codes: ['US'],
      language: 'en',
    });
    res.json({ link_token: response.data.link_token });
  } catch (error) {
    res.status(500).json({ error: error.message || 'link token failed' });
  }
});

app.get('/link', async (_req, res) => {
  if (!secretsReady()) {
    return res
      .status(503)
      .send(
        '<p>Demo / fixture mode. Add PLAID_CLIENT_ID and PLAID_SECRET to .env to enable Plaid sandbox Link. Access tokens stay on this server.</p>',
      );
  }
  try {
    const client = getPlaidClient();
    const response = await client.linkTokenCreate({
      user: { client_user_id: 'grokbot-local-user' },
      client_name: 'Grokbot',
      products: ['transactions', 'investments', 'liabilities'],
      country_codes: ['US'],
      language: 'en',
    });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(linkPage(response.data.link_token));
  } catch (error) {
    res.status(500).send(`<p>${error.message || 'Could not create link token'}</p>`);
  }
});

app.post('/item/public_token/exchange', async (req, res) => {
  const leaked = rejectClientAccessToken(req.body);
  if (leaked) return res.status(400).json(leaked);
  if (!secretsReady()) {
    return res.status(503).json({ error: 'Plaid secrets missing', mock: true, env: PLAID_ENV });
  }
  const publicToken = req.body?.public_token;
  if (!publicToken) return res.status(400).json({ error: 'public_token required' });
  try {
    const client = getPlaidClient();
    const exchange = await client.itemPublicTokenExchange({ public_token: publicToken });
    const accessToken = exchange.data.access_token;
    const itemId = exchange.data.item_id;
    const items = readItems();
    items[itemId] = { access_token: accessToken, created_at: new Date().toISOString() };
    writeItems(items);
    const snapshot = await buildSnapshot(client, itemId, accessToken);
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: error.message || 'exchange failed' });
  }
});

app.get('/items', (_req, res) => {
  if (!secretsReady()) {
    return res.status(503).json({ error: 'Plaid secrets missing', mock: true, items: [], env: PLAID_ENV });
  }
  const items = readItems();
  res.json({
    items: Object.entries(items).map(([itemId, record]) => ({
      itemId,
      createdAt: record.created_at,
    })),
  });
});

app.get('/snapshot', async (req, res) => {
  if (!secretsReady()) {
    return res.status(503).json({ error: 'Plaid secrets missing', mock: true, env: PLAID_ENV });
  }
  const itemId = String(req.query.item_id || '');
  const items = readItems();
  const record = items[itemId];
  if (!record?.access_token) {
    return res.status(404).json({ error: 'Unknown item. Access token is server-side only.' });
  }
  try {
    const snapshot = await buildSnapshot(getPlaidClient(), itemId, record.access_token);
    res.json(snapshot);
  } catch (error) {
    res.status(500).json({ error: error.message || 'snapshot failed' });
  }
});

async function buildSnapshot(client, itemId, accessToken) {
  const accountsRes = await client.accountsGet({ access_token: accessToken });
  let institutionName = 'Plaid account';
  try {
    const itemRes = await client.itemGet({ access_token: accessToken });
    const institutionId = itemRes.data.item.institution_id;
    if (institutionId) {
      const inst = await client.institutionsGetById({
        institution_id: institutionId,
        country_codes: ['US'],
      });
      institutionName = inst.data.institution.name;
    }
  } catch {
    // Institution lookup is optional.
  }

  const accounts = accountsRes.data.accounts.map((account) => ({
    id: account.account_id,
    name: account.name,
    institution: institutionName,
    type: mapAccountType(account.type, account.subtype),
    subtype: account.subtype || undefined,
    balance: signedBalance(account),
    available: account.balances.available ?? undefined,
    mask: account.mask || undefined,
    plaidAccountId: account.account_id,
    plaidItemId: itemId,
  }));

  let transactions = [];
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    const txRes = await client.transactionsGet({
      access_token: accessToken,
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
    });
    transactions = txRes.data.transactions.map((txn) => ({
      id: txn.transaction_id,
      accountId: txn.account_id,
      date: txn.date,
      merchant: txn.merchant_name || txn.name,
      amount: -txn.amount,
      categoryId: guessCategory(txn),
      pending: Boolean(txn.pending),
      isTransfer: isTransfer(txn),
      plaidTransactionId: txn.transaction_id,
    }));
  } catch {
    transactions = [];
  }

  return {
    item: {
      id: itemId,
      institutionName,
      itemId,
      products: ['transactions', 'investments', 'liabilities'],
      connectedAt: new Date().toISOString(),
      source: 'plaid',
    },
    accounts,
    transactions,
  };
}

function signedBalance(account) {
  const current = account.balances.current ?? 0;
  if (account.type === 'credit' || account.type === 'loan') return -Math.abs(current);
  return current;
}

function mapAccountType(type, subtype) {
  if (type === 'depository' && subtype === 'savings') return 'savings';
  if (type === 'depository') return 'checking';
  if (type === 'credit') return 'credit';
  if (type === 'loan') return 'loan';
  if (type === 'investment' && String(subtype || '').includes('401')) return 'retirement';
  if (type === 'investment') return 'investment';
  return 'other';
}

function isTransfer(txn) {
  const haystack = `${txn.name} ${txn.merchant_name || ''} ${(txn.category || []).join(' ')}`.toLowerCase();
  return haystack.includes('transfer') || haystack.includes('payment');
}

function guessCategory(txn) {
  const haystack = `${txn.name} ${txn.merchant_name || ''} ${(txn.category || []).join(' ')}`.toLowerCase();
  if (isTransfer(txn)) return 'cat_transfer';
  if (haystack.includes('payroll') || haystack.includes('deposit')) return 'cat_income';
  if (haystack.includes('grocery') || haystack.includes('supermarket')) return 'cat_groceries';
  if (haystack.includes('restaurant') || haystack.includes('coffee')) return 'cat_dining';
  if (haystack.includes('gas') || haystack.includes('fuel')) return 'cat_gas';
  if (haystack.includes('subscription') || haystack.includes('netflix')) return 'cat_subs';
  return 'cat_shopping';
}

function linkPage(linkToken) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Grokbot · Plaid Link</title>
    <style>
      body { font-family: ui-sans-serif, system-ui; background: #0B0F14; color: #F2F5F8; display: grid; place-items: center; min-height: 100vh; }
      main { width: min(420px, 92vw); background: #18212B; border: 1px solid #2A3542; border-radius: 20px; padding: 28px; }
      button { background: #3DDC97; color: #0B0F14; border: 0; border-radius: 12px; padding: 12px 16px; font-weight: 700; width: 100%; }
      p { color: #8B97A6; line-height: 1.5; }
    </style>
  </head>
  <body>
    <main>
      <h1>Connect an account</h1>
      <p>Plaid Link (${PLAID_ENV}). The public token is exchanged on this server. The access token is stored only in <code>server/data/items.json</code> and is never returned to the app.</p>
      <button id="link">Open Plaid Link</button>
      <p id="status"></p>
    </main>
    <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
    <script>
      const handler = Plaid.create({
        token: ${JSON.stringify(linkToken)},
        onSuccess: async (public_token) => {
          document.getElementById('status').textContent = 'Exchanging token on the server…';
          const res = await fetch('/item/public_token/exchange', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ public_token }),
          });
          const data = await res.json();
          document.getElementById('status').textContent = res.ok
            ? 'Connected. You can close this window and return to Grokbot.'
            : (data.error || 'Exchange failed');
        },
        onExit: (err) => {
          if (err) document.getElementById('status').textContent = err.display_message || err.error_message || 'Exited';
        },
      });
      document.getElementById('link').onclick = () => handler.open();
    </script>
  </body>
</html>`;
}

app.listen(PORT, () => {
  const health = buildHealthPayload({
    clientId: PLAID_CLIENT_ID,
    secret: PLAID_SECRET,
    env: PLAID_ENV,
  });
  console.log(`Grokbot Plaid helper on http://localhost:${PORT}`);
  console.log(`Mode: ${health.mode} (default env: sandbox, resolved env: ${health.env})`);
  console.log('Access tokens stay in server/data/items.json — never sent to the Expo client.');
  if (health.mock) {
    console.log('Fixture/mock mode: set PLAID_CLIENT_ID and PLAID_SECRET to enable sandbox Link.');
  }
});
