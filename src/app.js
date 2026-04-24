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

    // The four category keys the app knows about. Used as both template
    // selectors and button identifiers. Not reactive — never changes.
    _categoryKeys: ['person', 'item', 'activity', 'something-else'],

    // Persisted reactive state.
    history: this.$persist([]).as('lingo:history'),

    // Theme preference: 'system' | 'light' | 'dark'. Persisted so the
    // override survives reloads. 'system' tracks prefers-color-scheme live.
    theme: this.$persist('system').as('lingo:theme'),

    // Session-local counter; combined with Date.now() to build IDs that
    // don't collide with anything already in persisted history.
    _nextId: 1,

    // Cached media query listener so we can re-apply on OS changes while
    // the user is in 'system' mode.
    _mq: null,

    init() {
      this._loadData();
      this._initTheme();
      // Clean up orphaned localStorage from a previous version where
      // categories were a persisted selection. Harmless to leave, but
      // tidier to remove. Safe: key is namespaced, try/catch'd for
      // environments where localStorage is unavailable.
      try { localStorage.removeItem('lingo:categories'); } catch {}
    },

    _initTheme() {
      this._mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => {
        if (this.theme === 'system') this._applyTheme();
      };
      // Safari <14 used addListener; modern browsers use addEventListener.
      if (this._mq.addEventListener) this._mq.addEventListener('change', onChange);
      else this._mq.addListener(onChange);

      this.$watch('theme', () => this._applyTheme());
      this._applyTheme();
    },

    _applyTheme() {
      const resolved =
        this.theme === 'system'
          ? (this._mq && this._mq.matches ? 'dark' : 'light')
          : this.theme;
      document.documentElement.classList.toggle('dark', resolved === 'dark');
    },

    cycleTheme() {
      const order = ['system', 'light', 'dark'];
      const i = order.indexOf(this.theme);
      this.theme = order[(i + 1) % order.length];
    },

    get themeLabel() {
      return { system: 'system', light: 'light', dark: 'dark' }[this.theme];
    },

    get nextThemeLabel() {
      const order = ['system', 'light', 'dark'];
      const i = order.indexOf(this.theme);
      return order[(i + 1) % order.length];
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
        this._seedIfEmpty();
      } catch (err) {
        this.error = err.message;
        this.loading = false;
      }
    },

    // On first-ever load (no persisted history), seed a few suggestions so
    // the app feels alive instead of showing an empty column. suggest()
    // picks a random category each call, so the three seeds show variety.
    _seedIfEmpty() {
      if (this.history.length > 0) return;
      for (let i = 0; i < 3; i++) this.suggest();
    },

    // Enabled whenever data is ready. Category buttons and "Surprise me"
    // both share this gate.
    get canSuggest() {
      return !this.loading && !this.error;
    },

    // Generate one suggestion of a specific category. Called by the four
    // category buttons directly, and by suggest() after picking a random
    // category.
    suggestCategory(category) {
      if (!this.canSuggest) return;
      const templates = this.data.templates[category];
      const tpl = templates[Math.floor(Math.random() * templates.length)];
      const phrase = resolveTopLevel(tpl, this.data);
      const id = `${Date.now()}-${this._nextId++}`;
      this.history = [{ phrase, category, id }, ...this.history];
      if (this.history.length > 100) this.history = this.history.slice(0, 100);
    },

    // "Surprise me" — pick a random category and generate one from it.
    suggest() {
      if (!this.canSuggest) return;
      const category = this._categoryKeys[Math.floor(Math.random() * this._categoryKeys.length)];
      this.suggestCategory(category);
    },

    copyToClipboard(text) {
      navigator.clipboard.writeText(text);
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
