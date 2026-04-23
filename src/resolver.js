// Template resolver. Pure functions; no DOM, no Alpine, no fetch.

const PLACEHOLDER = /\{([^{}]+)\}/g;

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

export function resolveTopLevel(template, data, rand = Math.random) {
  return template.replace(PLACEHOLDER, (_match, inner) => {
    const p = parsePlaceholder(inner);
    if (p.kind === 'article') {
      throw new Error('a/an not yet implemented');
    }
    const list = data.words[p.category];
    if (!list) throw new Error(`unknown category: ${p.category}`);
    return pickFrom(list, rand);
  });
}
