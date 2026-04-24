import { resolveTopLevel } from './resolver.js';

async function fetchJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`failed to load ${path}: ${res.status}`);
  return res.json();
}

/**
 * Alpine component factory. Must be a standard function (not arrow)
 * so Alpine can bind `this` to the reactive component proxy when
 * evaluating the returned object — which is what lets us call
 * `this.$persist(...)` inside property initializers.
 *
 * Registered in `main.js` via Alpine.data('lingoApp', lingoApp).
 * `index.html` references it as x-data="lingoApp" (no parens).
 */
export function lingoApp() {
  return {
    loading: true,
    error: null,
    data: null,

    // Persisted reactive state.
    categories: this.$persist({
      person: false,
      item: false,
      activity: false,
      'something-else': false,
    }).as('lingo:categories'),

    history: this.$persist([]).as('lingo:history'),

    // Session-local counter; combined with Date.now() to build IDs that
    // don't collide with anything already in persisted history.
    _nextId: 1,

    init() {
      this._loadData();
    },

    async _loadData() {
      try {
        const base = import.meta.env.BASE_URL; // "/" in dev, "/lingo-generator/" in prod
        const [
          nouns, verbs, adjectives, adverbs, colors, prepositions, persons,
          irregulars,
          person, item, activity, somethingElse,
        ] = await Promise.all([
          fetchJson(base + 'data/words/nouns.json'),
          fetchJson(base + 'data/words/verbs.json'),
          fetchJson(base + 'data/words/adjectives.json'),
          fetchJson(base + 'data/words/adverbs.json'),
          fetchJson(base + 'data/words/colors.json'),
          fetchJson(base + 'data/words/prepositions.json'),
          fetchJson(base + 'data/words/persons.json'),
          fetchJson(base + 'data/irregulars.json'),
          fetchJson(base + 'data/templates/person.json'),
          fetchJson(base + 'data/templates/item.json'),
          fetchJson(base + 'data/templates/activity.json'),
          fetchJson(base + 'data/templates/something-else.json'),
        ]);
        this.data = {
          words: {
            noun: nouns, verb: verbs, adjective: adjectives, adverb: adverbs,
            color: colors, preposition: prepositions, person: persons,
          },
          irregulars,
          templates: { person, item, activity, 'something-else': somethingElse },
        };
        this.loading = false;
      } catch (err) {
        this.error = err.message;
        this.loading = false;
      }
    },

    get anyCategoryChecked() {
      return Object.values(this.categories).some(Boolean);
    },

    get allCategoriesChecked() {
      return Object.values(this.categories).every(Boolean);
    },

    get canSuggest() {
      return !this.loading && !this.error && this.anyCategoryChecked;
    },

    toggleAll() {
      const newState = this.allCategoriesChecked ? false : true;
      for (const key of Object.keys(this.categories)) {
        this.categories[key] = newState;
      }
    },

    suggest() {
      if (!this.canSuggest) return;
      const active = Object.entries(this.categories)
        .filter(([, v]) => v)
        .map(([k]) => k);
      const category = active[Math.floor(Math.random() * active.length)];
      const templates = this.data.templates[category];
      const tpl = templates[Math.floor(Math.random() * templates.length)];
      const phrase = resolveTopLevel(tpl, this.data);
      const id = `${Date.now()}-${this._nextId++}`;
      this.history = [{ phrase, category, id }, ...this.history];
      if (this.history.length > 100) this.history = this.history.slice(0, 100);
    },

    clearHistory() {
      this.history = [];
    },

    categoryLabel(key) {
      return {
        person: 'person',
        item: 'item',
        activity: 'activity',
        'something-else': 'something else',
      }[key] ?? key;
    },
  };
}
