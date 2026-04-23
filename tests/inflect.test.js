import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pluralize } from '../src/inflect.js';

const irr = {
  plurals: { child: 'children', foot: 'feet', person: 'people' },
  past: {}, ing: {}, articles: {},
};

test('pluralize: uses irregulars when present', () => {
  assert.equal(pluralize('child', irr), 'children');
  assert.equal(pluralize('foot', irr), 'feet');
});

test('pluralize: adds -s by default', () => {
  assert.equal(pluralize('cat', irr), 'cats');
  assert.equal(pluralize('dog', irr), 'dogs');
});

test('pluralize: adds -es to sibilant endings (s, x, z, ch, sh)', () => {
  assert.equal(pluralize('bus', irr), 'buses');
  assert.equal(pluralize('box', irr), 'boxes');
  assert.equal(pluralize('buzz', irr), 'buzzes');
  assert.equal(pluralize('church', irr), 'churches');
  assert.equal(pluralize('wish', irr), 'wishes');
});

test('pluralize: y after consonant -> ies', () => {
  assert.equal(pluralize('baby', irr), 'babies');
  assert.equal(pluralize('city', irr), 'cities');
});

test('pluralize: y after vowel stays -ys', () => {
  assert.equal(pluralize('boy', irr), 'boys');
  assert.equal(pluralize('key', irr), 'keys');
});

test('pluralize: survives missing irregulars object', () => {
  assert.equal(pluralize('cat', { plurals: {}, past: {}, ing: {}, articles: {} }), 'cats');
});

test('pluralize: irregular short-circuits the default rule', () => {
  // 'fish' ends in 'sh' so the default rule would produce 'fishes';
  // irregulars.plurals must take precedence.
  const fishIrr = { plurals: { fish: 'fish' }, past: {}, ing: {}, articles: {} };
  assert.equal(pluralize('fish', fishIrr), 'fish');
});
