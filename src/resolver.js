// Template resolver. Pure functions; no DOM, no Alpine, no fetch.

import { pluralize, ing, past } from './inflect.js';

const PLACEHOLDER = /\{([^{}]+)\}/g;
const MAX_DEPTH = 5;
const MAX_ATTEMPTS = 10;

export class RecursionError extends Error {}

function parsePlaceholder(inner) {
  if (inner === 'a/an') return { kind: 'article' };
  const colon = inner.indexOf(':');
  if (colon === -1) return { kind: 'word', category: inner, modifier: null };
  return {
    kind: 'word',
    category: inner.slice(0, colon),
    modifier: inner.slice(colon + 1),
  };
}

function pickFrom(list, rand) {
  const i = Math.floor(rand() * list.length);
  return list[i];
}

function pickFromFlat(list, rand) {
  const flat = list.filter((w) => !w.includes('{'));
  if (flat.length === 0) {
    // Last-resort: strip braces from a random pick so nothing leaks.
    return pickFrom(list, rand).replace(/[{}]/g, '');
  }
  return pickFrom(flat, rand);
}

function applyModifier(word, category, modifier, irregulars) {
  if (modifier === null) return word;
  if (category === 'noun' && modifier === 'plural') return pluralize(word, irregulars);
  if (category === 'verb' && modifier === 'ing')    return ing(word, irregulars);
  if (category === 'verb' && modifier === 'past')   return past(word, irregulars);
  throw new Error(`unknown modifier: ${category}:${modifier}`);
}

function containsPlaceholder(s) {
  return s.includes('{');
}

function resolveOnce(template, data, rand, depth, flatMode) {
  if (!flatMode && depth > MAX_DEPTH) throw new RecursionError();
  return template.replace(PLACEHOLDER, (_match, inner) => {
    const p = parsePlaceholder(inner);
    if (p.kind === 'article') {
      throw new Error('a/an not yet implemented');
    }
    const list = data.words[p.category];
    if (!list) throw new Error(`unknown category: ${p.category}`);
    let word;
    if (flatMode) {
      word = pickFromFlat(list, rand);
    } else {
      word = pickFrom(list, rand);
      if (containsPlaceholder(word)) {
        word = resolveOnce(word, data, rand, depth + 1, false);
      }
    }
    return applyModifier(word, p.category, p.modifier, data.irregulars);
  });
}

export function resolveTopLevel(template, data, rand = Math.random) {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      return resolveOnce(template, data, rand, 0, false);
    } catch (err) {
      if (!(err instanceof RecursionError)) throw err;
    }
  }
  // Flat-mode last resort: never recurses, never throws RecursionError.
  return resolveOnce(template, data, rand, 0, true);
}
