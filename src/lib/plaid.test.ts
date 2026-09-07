import assert from 'node:assert/strict';
import test from 'node:test';

import {
  countLivePlaidItems,
  describeConnectionStatus,
  isPlaidServerConfigured,
  normalizePlaidServerUrl,
  plaidLinkUrl,
} from './plaid';

test('empty helper URL keeps the client in fixture/demo mode', () => {
  assert.equal(normalizePlaidServerUrl(undefined), '');
  assert.equal(normalizePlaidServerUrl(''), '');
  assert.equal(normalizePlaidServerUrl('   '), '');
  assert.equal(isPlaidServerConfigured(''), false);
  assert.equal(isPlaidServerConfigured('http://localhost:8787'), true);
  assert.equal(normalizePlaidServerUrl('http://localhost:8787/'), 'http://localhost:8787');
});

test('Link URL is derived from the helper only — no secrets', () => {
  assert.equal(plaidLinkUrl('http://localhost:8787/'), 'http://localhost:8787/link');
});

test('connection copy: demo is the default path out of fixtures', () => {
  const demo = describeConnectionStatus({
    serverConfigured: false,
    liveItemCount: 0,
  });
  assert.equal(demo.mode, 'demo');
  assert.equal(demo.title, 'Demo mode');

  const helperMock = describeConnectionStatus({
    serverConfigured: true,
    health: { ok: false, mock: true, reason: 'PLAID_CLIENT_ID / PLAID_SECRET missing — fixture/mock mode' },
    liveItemCount: 0,
  });
  assert.equal(helperMock.mode, 'helper-mock');
  assert.equal(helperMock.title, 'Demo mode');

  const sandbox = describeConnectionStatus({
    serverConfigured: true,
    health: { ok: true, mock: false, mode: 'sandbox', env: 'sandbox' },
    liveItemCount: 0,
  });
  assert.equal(sandbox.mode, 'sandbox');
  assert.match(sandbox.title, /Sandbox/i);

  const linked = describeConnectionStatus({
    serverConfigured: true,
    health: { ok: true, mock: false, mode: 'sandbox', env: 'sandbox' },
    liveItemCount: 2,
  });
  assert.equal(linked.mode, 'linked');
  assert.equal(linked.title, 'Linked');
});

test('only source=plaid counts as a live Link — mock fixtures do not', () => {
  assert.equal(
    countLivePlaidItems([
      { source: 'mock' },
      { source: 'mock' },
      { source: 'plaid' },
    ]),
    1,
  );
});
