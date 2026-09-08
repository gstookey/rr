// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import sheriff from '@softarc/eslint-plugin-sheriff';

/**
 * ACME Workshop / RR workspace lint.
 *
 * The load-bearing block is the LAST one: `sheriff.configs.all` turns
 * `sheriff.config.ts` into an ESLint failure. That is the whole point of S0's
 * step 0 — "a cross-Floor import fails the build" (practical_picture_v0.md §6).
 * `scripts/prove-fence.sh` proves it by breaking it on purpose.
 *
 * ESLint is pinned to the 9.x line, NOT 10.x, because
 * `@softarc/eslint-plugin-sheriff@0.19.6` declares `eslint: "^8 || ^9"`. The
 * fence's tool chooses the linter major; see the S0 notes' open questions —
 * eslint 9 already prints an end-of-support warning on install.
 */
export default tseslint.config(
  {
    ignores: [
      'dist/**',
      '**/dist/**',
      '.angular/**',
      'node_modules/**',
      'legacy-shells/**',
      'docs/**',
      'images/**',
      'coverage/**',
    ],
  },

  // --- TypeScript sources -------------------------------------------------
  {
    files: ['**/*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // The published language and the fence both depend on explicit surfaces.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
    },
  },

  // --- Angular sources: components + templates ----------------------------
  {
    files: ['apps/**/*.ts', 'packages/{ui,auth,config,markings,windows,store-features}/**/*.ts'],
    extends: [...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'rr', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'rr', style: 'kebab-case' }],
      // Zoneless + OnPush-by-default is the v22 idiom; a component that opts
      // back into Default is a decision, not an accident.
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {},
  },

  // --- Node-side sources ---------------------------------------------------
  {
    files: ['services/**/*.ts', 'packages/mock-oidc/**/*.ts', 'scripts/**/*.mjs'],
    languageOptions: { globals: { process: 'readonly', console: 'readonly', URL: 'readonly' } },
  },

  // --- THE FENCE -----------------------------------------------------------
  sheriff.configs.all,
);
