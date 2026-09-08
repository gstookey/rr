/**
 * `@rr/common` — the published language.
 *
 * One module per bounded context, plus the cross-cutting `Marking` value object
 * that rides on every row, DTO and event envelope. Consumed by the browser (via
 * the tsconfig path alias, from source) and by Node (via the workspace symlink,
 * from `dist/`).
 *
 * FENCE: this package imports nothing internal — see README.md.
 */
export * from './marking.js';
export * as frontDesk from './front-desk.js';
export * as invent from './invent.js';
export * as command from './command.js';
export * as vigilance from './vigilance.js';
