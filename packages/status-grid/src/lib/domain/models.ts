import type { ValidationStatus } from './status';

/**
 * Status Grid — domain types.
 *
 * Created: 2026-10-01
 *
 *   Unit            a unit under test          → Unit List rows        (≤90, typically 14)
 *    └ Component    a part of that unit        → Status Grid ROWS      (≤20, typically 7)
 *       └ Element   a named part of that       → Details Deck TABS     (~7)
 *          └ Attribute  a validated field      → Details Deck CARDS    (~8)
 *
 * A SAMPLE is one (Component, timestamp) — the thing a grid cell draws. Selection is therefore a
 * COORDINATE, not an object id.
 *
 * NAMING. The identifiers carry a parent prefix (UnitComponent, ComponentElement, ElementAttribute)
 * because `Component` and `Attribute` are @angular/core exports and `Element` is a DOM global — a
 * module-level `Element` type would shadow the DOM one in every importing file. Prose keeps saying
 * Unit · Component · Element · Attribute.
 */

/** An ISO-8601 instant, e.g. '2026-10-01T04:15:00Z'. Always UTC: the feature speaks Zulu. */
export type Iso8601 = string;

export type UnitId = string;
export type ComponentId = string;
export type ElementId = string;
export type AttributeId = string;

export interface Unit {
  readonly id: UnitId;
  readonly name: string;
  /** Rolled up from the unit's elapsed samples by whoever serves the data. */
  readonly status: ValidationStatus;
  readonly startedAt: Iso8601;
  /** null while the test window is still open. */
  readonly stoppedAt: Iso8601 | null;
}

export interface UnitComponent {
  readonly id: ComponentId;
  readonly name: string;
}

/** One validated sample: a component's status at one timestamp. */
export interface Sample {
  readonly componentId: ComponentId;
  readonly timestamp: Iso8601;
  readonly status: ValidationStatus;
}

/**
 * Everything the grid needs for one unit, in a plain, serialisable shape — what a REST call or a
 * socket message would carry. A timestamp with no sample for a component is simply absent.
 */
export interface UnitGrid {
  readonly unitId: UnitId;
  readonly components: readonly UnitComponent[];
  /** The unit's sample times. A LIST, not a stride: cadence is irregular (~10–15 min). */
  readonly timestamps: readonly Iso8601[];
  readonly samples: readonly Sample[];
  /** Components whose retrieval failed: their elapsed samples without data read as ERROR. */
  readonly failedComponentIds: readonly ComponentId[];
}

export interface ComponentElement {
  readonly id: ElementId;
  readonly name: string;
  readonly status: ValidationStatus;
  readonly attributes: readonly ElementAttribute[];
}

export type AttributeMatch = 'MATCH' | 'MISMATCH' | 'MISSING';

export interface ElementAttribute {
  readonly id: AttributeId;
  readonly name: string;
  /**
   * DISPLAY strings, and `match` is AUTHORITATIVE. The client never re-derives a match by
   * comparing the two strings — '0.130' vs '0.13' would lie.
   */
  readonly expected: string;
  /** null when no value was received (match is then MISSING). */
  readonly actual: string | null;
  readonly match: AttributeMatch;
}

/** A cell, addressed by what it means rather than where it is drawn. */
export interface CellCoordinate {
  readonly componentId: ComponentId;
  readonly timestamp: Iso8601;
}

export function sameCoordinate(a: CellCoordinate | null, b: CellCoordinate | null): boolean {
  if (a === null || b === null) return a === b;
  return a.componentId === b.componentId && a.timestamp === b.timestamp;
}

/** Where a unit's test window stands relative to now. */
export type UnitPhase = 'scheduled' | 'running' | 'complete';

export function unitPhase(unit: Unit, nowMs: number): UnitPhase {
  if (Date.parse(unit.startedAt) > nowMs) return 'scheduled';
  if (unit.stoppedAt === null || Date.parse(unit.stoppedAt) > nowMs) return 'running';
  return 'complete';
}
