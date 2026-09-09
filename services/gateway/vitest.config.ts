import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.spec.ts'] },
  resolve: {
    alias: {
      // The CI-side OIDC provider (AW-D7) is consumed FROM SOURCE here: the gate
      // runs unit tests before it builds the Node services, so a dist-resolved
      // import would depend on build order. `@rr/common` needs no alias — it is
      // built first, by design, because Node consumers resolve it from dist.
      '@rr/mock-oidc': new URL('../../packages/mock-oidc/src/index.ts', import.meta.url).pathname,
    },
  },
});
