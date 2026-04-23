import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pluralize, ing, past, aAn } from '../src/inflect.js';

const irr = {
  plurals: { child: 'children', foot: 'feet', person: 'people' },
  ing: { lie: 'lying', die: 'dying', tie: 'tying', run: 'running', sit: 'sitting', hop: 'hopping', begin: 'beginning' },
  past: { run: 'ran', go: 'went', eat: 'ate', be: 'was', hop: 'hopped' },
  articles: { honest: 'an', honor: 'an', hour: 'an', heir: 'an', university: 'a', european: 'a', one: 'a' },
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
test('past: irregular', () => { assert.equal(past('run', irr), 'ran'); });
test('past: -e -> -d', () => { assert.equal(past('bake', irr), 'baked'); });
test('past: y/consonant -> ied', () => { assert.equal(past('cry', irr), 'cried'); });
test('past: y/vowel -> yed', () => { assert.equal(past('play', irr), 'played'); });
test('past: default -ed', () => { assert.equal(past('laugh', irr), 'laughed'); });
test('past: no doubling by default', () => { assert.equal(past('regret', irr), 'regreted'); });

// --- aAn ---
test('aAn: vowel-initial -> an', () => {
  assert.equal(aAn('apple', irr), 'an');
  assert.equal(aAn('orange', irr), 'an');
});

test('aAn: consonant-initial -> a', () => {
  assert.equal(aAn('cat', irr), 'a');
  assert.equal(aAn('dog', irr), 'a');
});

test('aAn: exceptions override the vowel rule', () => {
  assert.equal(aAn('honest', irr), 'an');
  assert.equal(aAn('university', irr), 'a');
  assert.equal(aAn('european', irr), 'a');
});

test('aAn: case-insensitive exception match', () => {
  assert.equal(aAn('Honor', irr), 'an');
  assert.equal(aAn('UNIVERSITY', irr), 'a');
});

test('aAn: empty / falsy input defaults to "a"', () => {
  assert.equal(aAn('', irr), 'a');
  assert.equal(aAn(undefined, irr), 'a');
  assert.equal(aAn(null, irr), 'a');
});

test('aAn: non-letter leading char falls back to first letter', () => {
  // Defensive: if the caller hands us punctuation-prefixed input (which the
  // resolver normally strips, but belt-and-suspenders), use the first letter.
  assert.equal(aAn('(apple', irr), 'an');
  assert.equal(aAn('"cat', irr), 'a');
});
