import assert from 'node:assert/strict';
import test from 'node:test';

import { cloudStarterSnapshot, isCloudSnapshotEmpty } from './cloudSnapshot';

test('new cloud accounts start empty except categories/rules', () => {
  const snap = cloudStarterSnapshot();
  assert.equal(snap.accounts.length, 0);
  assert.equal(snap.transactions.length, 0);
  assert.equal(snap.properties.length, 0);
  assert.ok(snap.categories.length > 0);
  assert.ok(snap.merchantRules.length > 0);
  assert.equal(isCloudSnapshotEmpty(snap), false);
});

test('empty snapshot detection ignores leftover retirement defaults', () => {
  const snap = cloudStarterSnapshot();
  snap.categories = [];
  snap.merchantRules = [];
  assert.equal(isCloudSnapshotEmpty(snap), true);
});
