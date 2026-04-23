import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pluralize, ing } from '../src/inflect.js';

const irr = {
  plurals: { child: 'children', foot: 'feet', person: 'people' },
  past: {}, articles: {},
  ing: { lie: 'lying', die: 'dying', tie: 'tying', run: 'running', sit: 'sitting', hop: 'hopping', begin: 'beginning' },
};

// --- pluralize ---

test('pluralize: uses irregulars when present', () => {
  assert.equal(pluralize('child', irr), 'children');
});

test('pluralize: adds -s by default', () => {
  assert.equal(pluralize('cat', irr), 'cats');
});

test('pluralize: adds -es to sibilant endings', () => {
  assert.equal(pluralize('box', irr), 'boxes');
  assert.equal(pluralize('church', irr), 'churches');
});

test('pluralize: y after consonant -> ies', () => {
  assert.equal(pluralize('baby', irr), 'babies');
});

test('pluralize: y after vowel stays -ys', () => {
  assert.equal(pluralize('boy', irr), 'boys');
});

// --- ing ---

test('ing: uses irregulars when present', () => {
  assert.equal(ing('lie', irr), 'lying');
  assert.equal(ing('run', irr), 'running');   // doubling via irregulars
  assert.equal(ing('begin', irr), 'beginning'); // doubling via irregulars
});

test('ing: drops silent e before adding ing', () => {
  assert.equal(ing('bake', irr), 'baking');
  assert.equal(ing('write', irr), 'writing');
});

test('ing: preserves -ee, -ye, -oe', () => {
  assert.equal(ing('see', irr), 'seeing');
  assert.equal(ing('dye', irr), 'dyeing');
  assert.equal(ing('toe', irr), 'toeing');
});

test('ing: default appends -ing with no doubling', () => {
  assert.equal(ing('laugh', irr), 'laughing');
  assert.equal(ing('paint', irr), 'painting');
  // Verbs that technically should double via stress rules but are NOT in
  // the irregulars list stay un-doubled by design. Tests lock this in.
  assert.equal(ing('forget', irr), 'forgeting');
});
