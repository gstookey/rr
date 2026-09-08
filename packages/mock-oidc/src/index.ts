/**
 * `@rr/mock-oidc` — the CI-side OIDC stub (AW-D7). See README.md for what this
 * is NOT allowed to become.
 */
export { createMockOidc, type MockOidc, type MockOidcOptions } from './provider.js';
export { DEV_PASSWORD, PERSONAS, findPersona, type Persona } from './personas.js';
