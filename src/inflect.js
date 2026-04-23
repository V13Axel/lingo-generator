// Pure inflection helpers. No DOM, no Alpine, no state.

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

/**
 * Return the plural form of a noun.
 * Consults `irregulars.plurals` first, otherwise applies a small set
 * of standard English rules.
 */
export function pluralize(word, irregulars) {
  if (irregulars?.plurals && irregulars.plurals[word]) {
    return irregulars.plurals[word];
  }
  if (/(s|x|z|ch|sh)$/i.test(word)) return word + 'es';
  if (/[^aeiou]y$/i.test(word)) return word.slice(0, -1) + 'ies';
  return word + 's';
}

function isVowel(ch) {
  return VOWELS.has(ch.toLowerCase());
}
// Export for use from later additions (ing, past, aAn).
export { isVowel as _isVowel };
