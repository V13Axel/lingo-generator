// Template resolver. Pure functions; no DOM, no Alpine, no fetch.

import { pluralize, ing, past, aAn } from './inflect.js';

const PLACEHOLDER = /\{([^{}]+)\}/g;
// Sentinel marks {a/an} positions during the first pass; the post-pass
// scans for it and chooses "a" or "an" based on the following word.
const ARTICLE_SENTINEL = '\u0000A/AN\u0000';
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
      // Leave a sentinel; settle it in the post-pass so the "next word" can
      // include the result of later placeholder resolution.
      return ARTICLE_SENTINEL;
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

/**
 * Replace every ARTICLE_SENTINEL with "a" or "an" based on the next word.
 * The "next word" scan skips any whitespace or non-letter characters so
 * templates like "({a/an} {noun})" or "{a/an}-{noun}" work correctly.
 */
function resolveArticles(text, irregulars) {
  // Global scan. We look up to the next letter run after each sentinel.
  return text.replace(new RegExp(ARTICLE_SENTINEL, 'g'), (_m, offset) => {
    const after = text.slice(offset + ARTICLE_SENTINEL.length);
    const nextWordMatch = after.match(/[A-Za-z][A-Za-z']*/);
    const next = nextWordMatch ? nextWordMatch[0] : '';
    return aAn(next, irregulars);
  });
}

export function resolveTopLevel(template, data, rand = Math.random) {
  let firstPass;
  let succeeded = false;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      firstPass = resolveOnce(template, data, rand, 0, false);
      succeeded = true;
      break;
    } catch (err) {
      if (!(err instanceof RecursionError)) throw err;
    }
  }
  if (!succeeded) {
    firstPass = resolveOnce(template, data, rand, 0, true);
  }
  return resolveArticles(firstPass, data.irregulars);
}
