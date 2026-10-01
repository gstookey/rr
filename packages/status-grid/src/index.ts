/**
 * Public API of `@rr/status-grid`.
 *
 * Created: 2026-10-01
 *
 * Four layers, each its own Sheriff module, importable only in this direction:
 *   feature (the window surface) → ui (unit list · status grid · details deck) → domain
 *   feature → data-access (store · clock · data source) → domain
 */
export * from './lib/domain';
export * from './lib/data-access';
export * from './lib/ui';
export * from './lib/feature';
