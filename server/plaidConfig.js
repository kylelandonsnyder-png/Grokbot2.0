'use strict';

/**
 * Sandbox is the only default. Production is opt-in.
 * Unknown values fall back to sandbox so a typo never silently
 * points the helper at live Plaid.
 */
function resolvePlaidEnv(raw) {
  const value = String(raw ?? 'sandbox').trim().toLowerCase();
  if (value === 'production' || value === 'prod') return 'production';
  return 'sandbox';
}

function hasPlaidSecrets(clientId, secret) {
  return Boolean(String(clientId || '').trim() && String(secret || '').trim());
}

function buildHealthPayload({ clientId, secret, env }) {
  const resolvedEnv = resolvePlaidEnv(env);
  const configured = hasPlaidSecrets(clientId, secret);
  return {
    ok: configured,
    mock: !configured,
    mode: configured ? resolvedEnv : 'mock',
    env: resolvedEnv,
    defaultEnv: 'sandbox',
    products: ['transactions', 'investments', 'liabilities'],
    storesAccessTokens: 'server-only',
    reason: configured ? undefined : 'PLAID_CLIENT_ID / PLAID_SECRET missing — fixture/mock mode',
  };
}

function rejectClientAccessToken(body) {
  if (body && typeof body === 'object' && body.access_token) {
    return {
      error: 'Do not send access tokens to this API. Tokens stay on the server.',
    };
  }
  return null;
}

module.exports = {
  resolvePlaidEnv,
  hasPlaidSecrets,
  buildHealthPayload,
  rejectClientAccessToken,
};
