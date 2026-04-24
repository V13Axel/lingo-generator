# Lingo Generator

A tiny single-page app that generates random "lingo" — short phrases in one of four categories — to feed into *Tomodachi Life: Living The Dream* conversation prompts.

Live site: https://v13axel.github.io/lingo-generator/

## How it works

Pick one or more categories in the sidebar, click **Suggest**, and a new phrase appears at the top of the list. Categories and history persist across reloads via `localStorage`.

The four categories match the game's prompts:

- **A person** — e.g. `Shaquille O'Neal`
- **An item** — e.g. `an impressive jackalope`
- **An activity** — e.g. `running with phoenixes`
- **Something else** — a grab-bag for anything that doesn't fit the other three

## Development

Requirements: Node 20.10+.

```bash
git clone git@github.com:V13Axel/lingo-generator.git
cd lingo-generator
npm install
npm run dev          # start Vite dev server with HMR
npm test             # run unit + integration tests
npm run build        # produce docs/
npm run preview      # locally serve docs/ to verify the production build
```

## Deploying

The `docs/` directory is committed to the repo. GitHub Pages is configured to serve from `main` branch, `/docs` folder.

To publish a change:

1. `npm run build`
2. Commit source *and* the resulting `docs/` changes together.
3. `git push`

GitHub Pages redeploys automatically.

Note: the directory `docs/superpowers/` is gitignored planning material and lives alongside the build output. The `prebuild` script (`scripts/clean-docs.mjs`) removes only Vite-owned artifacts before each build, preserving `docs/superpowers/`.

## Adding content

- Word lists: `public/data/words/*.json` — flat arrays of strings.
- Templates:  `public/data/templates/*.json` — flat arrays of template strings.
- Irregular plurals, past-tense verbs, `-ing` forms, and `a/an` exceptions: `public/data/irregulars.json`.

Template placeholders use `{category}` or `{category:modifier}`. Supported modifiers:

- `:plural` on `noun`
- `:ing` and `:past` on `verb`

The special token `{a/an}` selects the correct article based on the word that follows it (after any nested template expansion). Any entry in a word list that itself contains `{...}` is recursively resolved — so `"{adjective} {noun}"` in `nouns.json` creates compound outputs.

Consonant doubling in `-ing` / past-tense forms is handled exclusively via `irregulars.ing` and `irregulars.past`. If you add a new verb whose default form is wrong (e.g. `begin` → `begining`), add it to `irregulars.ing` (`begin → beginning`) and `irregulars.past` (`begin → began` already there).

## Smoke-test checklist

- [ ] `npm run dev` loads; Suggest enables after data loads.
- [ ] Various category combinations produce sensible output.
- [ ] History persists across reloads.
- [ ] Clear history confirms and clears.
- [ ] System dark-mode preference is honored.
- [ ] Layout stacks correctly on a narrow viewport.
- [ ] Suggest button's focus ring uses the accent color.
- [ ] `npm run build` produces a `docs/` that works under `npm run preview`.
- [ ] `docs/superpowers/` (if present) survives a rebuild untouched.
- [ ] Deployed site at the URL above matches local preview.

## License

Personal project. No license chosen yet.
