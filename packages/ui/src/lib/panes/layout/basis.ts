import type { RrPaneBasis, RrPaneBasisInput } from '../panes.types';

/**
 * Parse a consumer-written basis. Pure.
 *
 * Created: 2026-09-25
 *
 *   240 · '240' · '240px' → { unit: 'px', value: 240 }
 *   '30%'                 → { unit: '%',  value: 30  }
 *   '1fr' · '2.5fr'       → { unit: 'fr', value: 2.5 }
 *
 * Anything unparseable, negative or non-finite falls back to `1fr` — a pane that shares
 * space is always a safer default than one that silently renders at zero.
 */
export const DEFAULT_BASIS: RrPaneBasis = { unit: 'fr', value: 1 };

const BASIS_PATTERN = /^\s*(\d+(?:\.\d+)?|\.\d+)\s*(px|%|fr)?\s*$/i;

export function parseBasis(input: RrPaneBasisInput | null | undefined): RrPaneBasis {
  if (typeof input === 'number') {
    return Number.isFinite(input) && input >= 0 ? { unit: 'px', value: input } : DEFAULT_BASIS;
  }
  if (typeof input !== 'string') {
    return DEFAULT_BASIS;
  }
  const match = BASIS_PATTERN.exec(input);
  if (!match) {
    return DEFAULT_BASIS;
  }
  const value = Number(match[1]);
  const unit = (match[2] ?? 'px').toLowerCase() as RrPaneBasis['unit'];
  if (!Number.isFinite(value) || (unit === 'fr' && value === 0)) {
    return DEFAULT_BASIS;
  }
  return { unit, value };
}
