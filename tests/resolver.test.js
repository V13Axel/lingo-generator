import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTopLevel } from '../src/resolver.js';

const pickFirst = () => 0;

const basicData = {
  words: {
    noun:        ['cat'],
    verb:        ['run'],
    adjective:   ['happy'],
    adverb:      ['quickly'],
    color:       ['red'],
    preposition: ['with'],
    person:      ["Shaquille O'Neal"],
  },
  irregulars: { plurals: {}, past: {}, ing: {}, articles: {} },
};

test('literal passthrough', () => {
  assert.equal(resolveTopLevel('hello world', basicData, pickFirst), 'hello world');
});
test('single placeholder', () => {
  assert.equal(resolveTopLevel('{noun}', basicData, pickFirst), 'cat');
});
test('multiple placeholders', () => {
  assert.equal(resolveTopLevel('{adjective} {noun}', basicData, pickFirst), 'happy cat');
});
test('unknown category throws', () => {
  assert.throws(() => resolveTopLevel('{bogus}', basicData, pickFirst), /unknown category/i);
});

// Modifiers
const modData = {
  words: {
    noun: ['cat'], verb: ['run'],
    adjective: [], adverb: [], color: [], preposition: [], person: [],
  },
  irregulars: {
    plurals: { cat: 'cats' },
    past: { run: 'ran' },
    ing: { run: 'running' },
    articles: {},
  },
};

test(':plural on noun', () => {
  assert.equal(resolveTopLevel('{noun:plural}', modData, pickFirst), 'cats');
});
test(':ing on verb', () => {
  assert.equal(resolveTopLevel('{verb:ing}', modData, pickFirst), 'running');
});
test(':past on verb', () => {
  assert.equal(resolveTopLevel('{verb:past}', modData, pickFirst), 'ran');
});
test('unknown modifier throws', () => {
  assert.throws(() => resolveTopLevel('{noun:bogus}', modData, pickFirst), /unknown modifier/i);
});
test('incompatible modifier/category throws', () => {
  assert.throws(() => resolveTopLevel('{noun:ing}', modData, pickFirst), /unknown modifier/i);
});

// Scripted rand for multi-step determinism.
function scriptedRand(sequence) {
  let i = 0;
  return () => {
    const v = sequence[i % sequence.length];
    i += 1;
    return v;
  };
}

test('nested: drawn word containing {...} is resolved recursively', () => {
  const data = {
    words: {
      noun:      ['{adjective} cat'],
      adjective: ['tiny'],
      verb: [], adverb: [], color: [], preposition: [], person: [],
    },
    irregulars: { plurals: {}, past: {}, ing: {}, articles: {} },
  };
  assert.equal(resolveTopLevel('{noun}', data, pickFirst), 'tiny cat');
});

test('nested: 3-deep recursion works', () => {
  const data = {
    words: {
      // indices:  0         1         2
      noun:      ['{noun}', '{noun}', 'dog'],
      adjective: [], verb: [], adverb: [], color: [], preposition: [], person: [],
    },
    irregulars: { plurals: {}, past: {}, ing: {}, articles: {} },
  };
  // Sequence resolves: 0 -> 0 -> 2 (dog).
  // rand returns a value in [0,1); Math.floor(v * 3) = index.
  // Use values 0.0, 0.0, 0.67 to produce indices 0, 0, 2.
  const rand = scriptedRand([0.0, 0.0, 0.67]);
  assert.equal(resolveTopLevel('{noun}', data, rand), 'dog');
});

test('nested: modifier applies to the fully-resolved string', () => {
  const data = {
    words: {
      noun: ['{adjective} cat'],
      adjective: ['shiny'],
      verb: [], adverb: [], color: [], preposition: [], person: [],
    },
    irregulars: { plurals: {}, past: {}, ing: {}, articles: {} },
  };
  // Spec-documented behavior: :plural applies to "shiny cat" as a whole.
  assert.equal(resolveTopLevel('{noun:plural}', data, pickFirst), 'shiny cats');
});
