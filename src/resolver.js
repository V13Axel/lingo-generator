// Template resolver. Pure functions; no DOM, no Alpine, no fetch.

import { pluralize, ing, past } from './inflect.js';

const PLACEHOLDER = /\{([^{}]+)\}/g;
const MAX_DEPTH = 5;

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

function resolveOnce(template, data, rand, depth) {
  if (depth > MAX_DEPTH) throw new RecursionError();
  return template.replace(PLACEHOLDER, (_match, inner) => {
    const p = parsePlaceholder(inner);
    if (p.kind === 'article') {
      throw new Error('a/an not yet implemented');
    }
    const list = data.words[p.category];
    if (!list) throw new Error(`unknown category: ${p.category}`);
    let word = pickFrom(list, rand);
    if (containsPlaceholder(word)) {
      word = resolveOnce(word, data, rand, depth + 1);
    }
    return applyModifier(word, p.category, p.modifier, data.irregulars);
  });
}

export function resolveTopLevel(template, data, rand = Math.random) {
  return resolveOnce(template, data, rand, 0);
}
