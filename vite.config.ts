// `vitest/config` rather than `vite`, so the `test` block below is typed.
// The alternative is a second config file, and two config files drift.
import { defineConfig } from 'vitest/config';

// Relative base so the built page works from a file path, a subdirectory or a
// domain root without a rebuild. There is no router and no backend, so there
// is nothing an absolute base would buy.
export default defineConfig({
  base: './',
  build: {
    target: 'es2023',
    // The page is four modules and a stylesheet. A source map costs nothing
    // to ship and is the difference between a readable stack trace and a
    // minified one when someone files a bug against the deployed page.
    sourcemap: true,
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
