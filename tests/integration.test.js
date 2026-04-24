import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveTopLevel } from '../src/resolver.js';

async function loadJson(relPath) {
  const url = new URL(relPath, import.meta.url);
  return JSON.parse(await readFile(url, 'utf8'));
}

async function loadAllData() {
  const [
    nouns, verbs, adjectives, adverbs, colors, prepositions, persons,
    irregulars,
  ] = await Promise.all([
    loadJson('../public/data/words/nouns.json'),
    loadJson('../public/data/words/verbs.json'),
    loadJson('../public/data/words/adjectives.json'),
    loadJson('../public/data/words/adverbs.json'),
    loadJson('../public/data/words/colors.json'),
    loadJson('../public/data/words/prepositions.json'),
    loadJson('../public/data/words/persons.json'),
    loadJson('../public/data/irregulars.json'),
  ]);
  return {
    words: {
      noun: nouns, verb: verbs, adjective: adjectives, adverb: adverbs,
      color: colors, preposition: prepositions, person: persons,
    },
    irregulars,
  };
}

const categories = ['person', 'item', 'activity', 'something-else'];

test('integration: every template resolves cleanly 50 times', async () => {
  const data = await loadAllData();
  for (const cat of categories) {
    const templates = await loadJson(`../public/data/templates/${cat}.json`);
    for (const tpl of templates) {
      for (let i = 0; i < 50; i++) {
        const out = resolveTopLevel(tpl, data);
        assert.ok(typeof out === 'string' && out.length > 0, `empty/invalid for ${tpl}: ${out}`);
        assert.ok(!out.includes('{'), `leaked '{' for ${tpl}: ${out}`);
        assert.ok(!out.includes('}'), `leaked '}' for ${tpl}: ${out}`);
      }
    }
  }
});
