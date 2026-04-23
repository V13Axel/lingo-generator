import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pluralize, ing, past } from '../src/inflect.js';

const irr = {
  plurals: { child: 'children', foot: 'feet', person: 'people' },
  articles: {},
  ing: { lie: 'lying', die: 'dying', tie: 'tying', run: 'running', sit: 'sitting', hop: 'hopping', begin: 'beginning' },
  past: { run: 'ran', go: 'went', eat: 'ate', be: 'was', hop: 'hopped' },
};

// --- pluralize ---
test('pluralize: irregular', () => { assert.equal(pluralize('child', irr), 'children'); });
test('pluralize: default', () => { assert.equal(pluralize('cat', irr), 'cats'); });
test('pluralize: sibilant', () => { assert.equal(pluralize('box', irr), 'boxes'); });
test('pluralize: y/consonant', () => { assert.equal(pluralize('baby', irr), 'babies'); });
test('pluralize: y/vowel', () => { assert.equal(pluralize('boy', irr), 'boys'); });

// --- ing ---
test('ing: irregular', () => { assert.equal(ing('lie', irr), 'lying'); });
test('ing: silent e', () => { assert.equal(ing('bake', irr), 'baking'); });
test('ing: preserves ee/ye/oe', () => {
  assert.equal(ing('see', irr), 'seeing');
  assert.equal(ing('dye', irr), 'dyeing');
});
test('ing: default append', () => { assert.equal(ing('laugh', irr), 'laughing'); });
test('ing: no doubling by default', () => { assert.equal(ing('forget', irr), 'forgeting'); });

// --- past ---
test('past: uses irregulars when present', () => {
  assert.equal(past('run', irr), 'ran');
  assert.equal(past('go', irr), 'went');
  assert.equal(past('hop', irr), 'hopped'); // doubling via irregulars
});

test('past: adds -d to words ending in e', () => {
  assert.equal(past('bake', irr), 'baked');
  assert.equal(past('dance', irr), 'danced');
});

test('past: y after consonant -> ied', () => {
  assert.equal(past('cry', irr), 'cried');
  assert.equal(past('try', irr), 'tried');
});

test('past: y after vowel -> yed', () => {
  assert.equal(past('play', irr), 'played');
  assert.equal(past('stay', irr), 'stayed');
});

test('past: default appends -ed with no doubling', () => {
  assert.equal(past('laugh', irr), 'laughed');
  assert.equal(past('paint', irr), 'painted');
  assert.equal(past('regret', irr), 'regreted'); // locked in: no default doubling
});
