import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTopLevel } from '../src/resolver.js';

// Deterministic rand: always picks index 0.
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

test('resolveTopLevel: literal text passes through unchanged', () => {
  assert.equal(resolveTopLevel('hello world', basicData, pickFirst), 'hello world');
});

test('resolveTopLevel: single placeholder is substituted', () => {
  assert.equal(resolveTopLevel('{noun}', basicData, pickFirst), 'cat');
});

test('resolveTopLevel: multiple placeholders substituted independently', () => {
  assert.equal(resolveTopLevel('{adjective} {noun}', basicData, pickFirst), 'happy cat');
});

test('resolveTopLevel: mixed literal and placeholders', () => {
  assert.equal(
    resolveTopLevel('I saw a {color} {noun} today', basicData, pickFirst),
    'I saw a red cat today'
  );
});

test('resolveTopLevel: unknown category throws', () => {
  assert.throws(
    () => resolveTopLevel('{bogus}', basicData, pickFirst),
    /unknown category/i
  );
});
