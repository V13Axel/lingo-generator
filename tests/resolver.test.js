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
