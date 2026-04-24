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

test('recursion: pathological self-reference falls back to flat mode', () => {
  const data = {
    words: {
      // index 2 is the only plain string.
      noun: ['{noun}', '{noun}', 'stone'],
      adjective: [], verb: [], adverb: [], color: [], preposition: [], person: [],
    },
    irregulars: { plurals: {}, past: {}, ing: {}, articles: {} },
  };
  // Force every draw to index 0 during normal attempts -> all 10 attempts
  // exhaust the cap -> flat mode must pick from plain strings only -> "stone".
  const rand = () => 0;
  assert.equal(resolveTopLevel('{noun}', data, rand), 'stone');
});

test('recursion: deterministic flat-mode fallback with no plain strings', () => {
  // When a list is entirely templates and flat mode still has to draw,
  // the implementation strips braces from the pick as a last resort so
  // nothing ever leaks to the UI.
  const data = {
    words: {
      noun: ['{noun}'],
      adjective: [], verb: [], adverb: [], color: [], preposition: [], person: [],
    },
    irregulars: { plurals: {}, past: {}, ing: {}, articles: {} },
  };
  const out = resolveTopLevel('{noun}', data, () => 0);
  assert.ok(!out.includes('{'), `leaked brace: ${out}`);
  assert.ok(!out.includes('}'), `leaked brace: ${out}`);
});

test('recursion: output never contains raw braces (stress test)', () => {
  const data = {
    words: {
      noun: ['{noun}', '{adjective} {noun}', 'rock'],
      adjective: ['{adjective}', 'big'],
      verb: [], adverb: [], color: [], preposition: [], person: [],
    },
    irregulars: { plurals: {}, past: {}, ing: {}, articles: {} },
  };
  for (let i = 0; i < 200; i++) {
    const out = resolveTopLevel('{noun}', data);
    assert.ok(!out.includes('{'), `leaked '{' in: ${out}`);
    assert.ok(!out.includes('}'), `leaked '}' in: ${out}`);
  }
});

test('a/an: before vowel-initial word -> an', () => {
  const data = {
    words: { noun: ['apple'], adjective: [], verb: [], adverb: [], color: [], preposition: [], person: [] },
    irregulars: { plurals: {}, past: {}, ing: {}, articles: {} },
  };
  assert.equal(resolveTopLevel('{a/an} {noun}', data, pickFirst), 'an apple');
});

test('a/an: before consonant-initial word -> a', () => {
  const data = {
    words: { noun: ['cat'], adjective: [], verb: [], adverb: [], color: [], preposition: [], person: [] },
    irregulars: { plurals: {}, past: {}, ing: {}, articles: {} },
  };
  assert.equal(resolveTopLevel('{a/an} {noun}', data, pickFirst), 'a cat');
});

test('a/an: consults articles exception list', () => {
  const data = {
    words: { noun: ['honest'], adjective: [], verb: [], adverb: [], color: [], preposition: [], person: [] },
    irregulars: { plurals: {}, past: {}, ing: {}, articles: { honest: 'an' } },
  };
  assert.equal(resolveTopLevel('{a/an} {noun}', data, pickFirst), 'an honest');
});

test('a/an: at end with no following word -> a', () => {
  const data = {
    words: { noun: [], adjective: [], verb: [], adverb: [], color: [], preposition: [], person: [] },
    irregulars: { plurals: {}, past: {}, ing: {}, articles: {} },
  };
  assert.equal(resolveTopLevel('{a/an}', data, pickFirst), 'a');
});

test('a/an: inspects nested-resolution result', () => {
  const data = {
    words: {
      noun: ['{adjective} elephant'],
      adjective: ['enormous'],
      verb: [], adverb: [], color: [], preposition: [], person: [],
    },
    irregulars: { plurals: {}, past: {}, ing: {}, articles: {} },
  };
  assert.equal(resolveTopLevel('{a/an} {noun}', data, pickFirst), 'an enormous elephant');
});

test('a/an: survives through a recursion boundary (nested template containing {a/an})', () => {
  const data = {
    words: {
      person: ['{a/an} {adjective} friend'],
      adjective: ['old'],
      noun: [], verb: [], adverb: [], color: [], preposition: [],
    },
    irregulars: { plurals: {}, past: {}, ing: {}, articles: {} },
  };
  // Drawn person is a template with its own {a/an} token. That token's sentinel
  // must bubble up through the outer resolve and be settled by the top-level
  // post-pass.
  assert.equal(resolveTopLevel('{person}', data, pickFirst), 'an old friend');
});

test('a/an: handles punctuation between sentinel and next word', () => {
  // Template author uses "({a/an} {noun})". The paren must not trip the post-pass.
  const data = {
    words: { noun: ['apple'], adjective: [], verb: [], adverb: [], color: [], preposition: [], person: [] },
    irregulars: { plurals: {}, past: {}, ing: {}, articles: {} },
  };
  assert.equal(resolveTopLevel('({a/an} {noun})', data, pickFirst), '(an apple)');
});
