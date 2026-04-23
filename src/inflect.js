// Pure inflection helpers. No DOM, no Alpine, no state.

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

/**
 * Return the plural form of a noun.
 * Consults `irregulars.plurals` first, otherwise applies standard rules.
 */
export function pluralize(word, irregulars) {
  if (irregulars?.plurals && irregulars.plurals[word]) {
    return irregulars.plurals[word];
  }
  if (/(s|x|z|ch|sh)$/i.test(word)) return word + 'es';
  if (/[^aeiou]y$/i.test(word)) return word.slice(0, -1) + 'ies';
  return word + 's';
}

/**
 * Return the -ing (present participle) form of a verb.
 * Consults `irregulars.ing` first. The default rule drops silent -e and
 * appends -ing; it intentionally never doubles consonants. Spelling alone
 * cannot reliably predict doubling (stress-dependent), so doubled forms
 * must be provided via irregulars.
 */
export function ing(verb, irregulars) {
  if (irregulars?.ing && irregulars.ing[verb]) {
    return irregulars.ing[verb];
  }
  // Drop silent final 'e', except keep -ee, -ye, -oe where the 'e' is
  // part of the pronounced vowel cluster.
  if (
    verb.endsWith('e') &&
    !verb.endsWith('ee') &&
    !verb.endsWith('ye') &&
    !verb.endsWith('oe')
  ) {
    return verb.slice(0, -1) + 'ing';
  }
  return verb + 'ing';
}

function isVowel(ch) {
  return VOWELS.has(ch.toLowerCase());
}
export { isVowel as _isVowel };
