'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  resolvePlaidEnv,
  hasPlaidSecrets,
  buildHealthPayload,
  rejectClientAccessToken,
} = require('./plaidConfig');

test('Plaid env defaults to sandbox and rejects unknown values', () => {
  assert.equal(resolvePlaidEnv(undefined), 'sandbox');
  assert.equal(resolvePlaidEnv(''), 'sandbox');
  assert.equal(resolvePlaidEnv('sandbox'), 'sandbox');
  assert.equal(resolvePlaidEnv('SANDBOX'), 'sandbox');
  assert.equal(resolvePlaidEnv('development'), 'sandbox');
  assert.equal(resolvePlaidEnv('production'), 'production');
  assert.equal(resolvePlaidEnv('prod'), 'production');
});

test('secrets are required for live Link; empty env stays in mock', () => {
  assert.equal(hasPlaidSecrets('', ''), false);
  assert.equal(hasPlaidSecrets('id', ''), false);
  assert.equal(hasPlaidSecrets('', 'secret'), false);
  assert.equal(hasPlaidSecrets('id', 'secret'), true);
});

test('health payload never includes secrets and labels mock vs sandbox', () => {
  const mock = buildHealthPayload({ clientId: '', secret: '', env: 'sandbox' });
  assert.equal(mock.ok, false);
  assert.equal(mock.mock, true);
  assert.equal(mock.mode, 'mock');
  assert.equal(mock.env, 'sandbox');
  assert.equal(mock.defaultEnv, 'sandbox');
  assert.equal(mock.storesAccessTokens, 'server-only');
  assert.equal(JSON.stringify(mock).includes('super-secret'), false);

  const live = buildHealthPayload({
    clientId: 'id',
    secret: 'super-secret',
    env: 'sandbox',
  });
  assert.equal(live.ok, true);
  assert.equal(live.mock, false);
  assert.equal(live.mode, 'sandbox');
  assert.equal(JSON.stringify(live).includes('super-secret'), false);
});

test('client-supplied access tokens are rejected', () => {
  assert.equal(rejectClientAccessToken({ public_token: 'public-sandbox-x' }), null);
  const rejected = rejectClientAccessToken({ access_token: 'access-sandbox-x' });
  assert.ok(rejected?.error);
  assert.match(rejected.error, /server/i);
});
