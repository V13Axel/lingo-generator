import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/lingo-generator/' : '/',
  plugins: [tailwindcss()],
  build: {
    outDir: 'docs',
    // emptyOutDir: false because docs/superpowers/ lives alongside the build
    // output (it's gitignored planning material). A pre-build script (see
    // package.json "prebuild") removes only the Vite-owned artifacts so
    // docs/superpowers/ survives across builds.
    emptyOutDir: false,
  },
}));
