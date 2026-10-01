import {
  buildGridRows,
  buildTimeAxis,
  elapsedColumnCount,
  worstOf,
  type AttributeMatch,
  type CellCoordinate,
  type ComponentElement,
  type ElementAttribute,
  type Sample,
  type Unit,
  type UnitComponent,
  type UnitGrid,
  type UnitId,
  type ValidationStatus,
} from '../domain';
import type { StatusGridDataSource } from './status-grid.data-source';

/**
 * Deterministic demo/test data: a wind farm's turbines under telemetry validation.
 *
 * Created: 2026-10-01
 *
 * The scenario is structurally identical to the real feature (Unit → Component → Element →
 * Attribute) and carries nothing proprietary. Every state the UI must render is present:
 *   • WTG-01…10   running today (00:00Z → 24:00Z): elapsed samples, a PENDING tail, a NO_DATA future
 *   • WTG-04      the Converter's retrieval FAILED → an unbroken ERROR row (and the banner)
 *   • WTG-07      20 components — the dense, scrolling grid
 *   • WTG-11, 12  complete (yesterday)
 *   • WTG-13      scheduled (tomorrow) — all NO_DATA
 *   • WTG-14      overnight window crossing midnight
 * Same `now` and `seed` → identical data, so specs and screenshots are stable.
 */
export interface TurbineFixtureOptions {
  /** The clock the data is generated against (epoch ms). */
  readonly now: number;
  readonly seed?: number;
}

const HOUR = 3_600_000;
const MINUTE = 60_000;
/** Samples arrive this long after their timestamp; younger elapsed cells read PENDING. */
const ARRIVAL_LAG = 25 * MINUTE;

const COMPONENTS = ['Gearbox', 'Generator', 'Yaw Drive', 'Pitch System', 'Converter', 'Nacelle Sensors', 'Tower'];
const EXTRA_COMPONENTS = [
  'Main Bearing', 'Hub', 'Blade A', 'Blade B', 'Blade C', 'Brake', 'Hydraulics',
  'Cooling', 'Transformer', 'Switchgear', 'Anemometer', 'Lightning Protection', 'SCADA Link',
];
const ELEMENTS = [
  'Oil Temp Probe', 'Vibration Sensor A', 'Vibration Sensor B', 'Filter Pressure',
  'Shaft Speed', 'Bearing Temp', 'Lube Pump',
];
/** [attribute name, expected value, a plausible wrong value] — the units vary by element. */
const ATTRIBUTES: readonly (readonly [string, string, string])[] = [
  ['Sample Rate', '10 Hz', '12 Hz'],
  ['Range Min', '-40.0', '-35.0'],
  ['Range Max', '120.0', '150.0'],
  ['Calibration Offset', '0.00', '0.13'],
  ['Firmware Rev', '4.2.1', '4.1.9'],
  ['Scaling Factor', '1.000', '0.980'],
  ['Units', '', ''],
  ['Last Cal Date', '2026-08-14', '2025-11-02'],
];
const UNIT_OF: Readonly<Record<string, readonly [string, string]>> = {
  'Oil Temp Probe': ['°C', '°F'],
  'Vibration Sensor A': ['mm/s', 'in/s'],
  'Vibration Sensor B': ['mm/s', 'in/s'],
  'Filter Pressure': ['bar', 'psi'],
  'Shaft Speed': ['rpm', 'Hz'],
  'Bearing Temp': ['°C', '°F'],
  'Lube Pump': ['L/min', 'gal/min'],
};

/** Small, fast, seedable PRNG (mulberry32). */
function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/** FNV-1a — a stable 32-bit seed from a string. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

const slug = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const iso = (ms: number): string => new Date(ms).toISOString().replace('.000Z', 'Z');

interface UnitSpec {
  readonly id: UnitId;
  readonly start: number;
  readonly stop: number;
  readonly open: boolean;
  readonly componentCount: number;
  readonly failed: readonly string[];
}

export function createTurbineFixtures(options: TurbineFixtureOptions): StatusGridDataSource {
  const { now } = options;
  const seed = options.seed ?? 7;
  const day = Math.floor(now / (24 * HOUR)) * 24 * HOUR;

  const specs: UnitSpec[] = [];
  for (let n = 1; n <= 14; n++) {
    const id = `WTG-${String(n).padStart(2, '0')}`;
    let start = day;
    let stop = day + 24 * HOUR;
    if (n === 11 || n === 12) [start, stop] = [day - 24 * HOUR, day];
    if (n === 13) [start, stop] = [day + 30 * HOUR, day + 42 * HOUR];
    if (n === 14) [start, stop] = [day - 6 * HOUR, day + 6 * HOUR];
    specs.push({
      id,
      start,
      stop,
      open: stop > now,
      componentCount: n === 7 ? 20 : 7,
      failed: n === 4 ? ['converter'] : [],
    });
  }

  const grids = new Map<UnitId, UnitGrid>(specs.map((spec) => [spec.id, buildGrid(spec, now, seed)]));
  const units: Unit[] = specs.map((spec) => {
    const grid = grids.get(spec.id) as UnitGrid;
    const axis = buildTimeAxis(grid.timestamps);
    const elapsed = elapsedColumnCount(axis, now);
    const rows = buildGridRows(axis, grid, elapsed);
    return {
      id: spec.id,
      name: spec.id,
      status: worstOf(rows.map((r) => r.rollup)),
      startedAt: iso(spec.start),
      stoppedAt: spec.open ? null : iso(spec.stop),
    };
  });

  return {
    units: () => units,
    unitGrid: (unitId) => grids.get(unitId) ?? null,
    sampleDetail: (unitId, coordinate) => {
      const grid = grids.get(unitId);
      const sample = grid?.samples.find(
        (s) => s.componentId === coordinate.componentId && s.timestamp === coordinate.timestamp,
      );
      return sample ? detailFor(unitId, coordinate, sample.status) : [];
    },
  };
}

function buildGrid(spec: UnitSpec, now: number, seed: number): UnitGrid {
  const rand = random(seed ^ hash(spec.id));
  const names = [...COMPONENTS, ...EXTRA_COMPONENTS].slice(0, spec.componentCount);
  const components: UnitComponent[] = names.map((name) => ({ id: slug(name), name }));

  // Irregular cadence: 10, 12 or 15 minutes between samples.
  const timestamps: string[] = [];
  for (let t = spec.start; t < spec.stop; t += [10, 12, 15][Math.floor(rand() * 3)] * MINUTE) timestamps.push(iso(t));

  const samples: Sample[] = [];
  for (const component of components) {
    if (spec.failed.includes(component.id)) continue; // nothing arrives: elapsed cells read ERROR
    // Each component has its own temperament, so rows read differently.
    const shaky = rand() < 0.3 ? 0.08 : 0.012;
    for (const timestamp of timestamps) {
      if (Date.parse(timestamp) > now - ARRIVAL_LAG) break; // not arrived yet → PENDING, then NO_DATA
      const roll = rand();
      const status: ValidationStatus = roll < shaky / 2 ? 'INVALID' : roll < shaky * 1.5 ? 'PARTIAL' : 'VALID';
      samples.push({ componentId: component.id, timestamp, status });
    }
  }
  return {
    unitId: spec.id,
    components,
    timestamps,
    samples,
    failedComponentIds: components.filter((c) => spec.failed.includes(c.id)).map((c) => c.id),
  };
}

/** The element/attribute detail behind one sample, consistent with that sample's status.
 *  (Fixture samples are only ever VALID, PARTIAL or INVALID — the other statuses have no sample.) */
function detailFor(unitId: UnitId, coordinate: CellCoordinate, status: ValidationStatus): ComponentElement[] {
  const rand = random(hash(`${unitId}|${coordinate.componentId}|${coordinate.timestamp}`));
  // Which elements carry the problem: one or two for PARTIAL / INVALID.
  const flagged = new Set<number>();
  if (status !== 'VALID') {
    flagged.add(Math.floor(rand() * ELEMENTS.length));
    if (rand() < 0.5) flagged.add(Math.floor(rand() * ELEMENTS.length));
  }

  return ELEMENTS.map((name, e): ComponentElement => {
    const elementStatus: ValidationStatus = flagged.has(e) ? status : 'VALID';
    const attributes = ATTRIBUTES.map(([attribute, expected, wrong], a): ElementAttribute => {
      const [unitExpected, unitWrong] = UNIT_OF[name];
      const want = attribute === 'Units' ? unitExpected : expected;
      let match: AttributeMatch = 'MATCH';
      if (elementStatus === 'INVALID' && (a === 3 || rand() < 0.15)) match = 'MISMATCH';
      if (elementStatus === 'PARTIAL' && (a === 7 || rand() < 0.15)) match = 'MISSING';
      const actual = match === 'MISSING' ? null : match === 'MISMATCH' ? (attribute === 'Units' ? unitWrong : wrong) : want;
      return { id: `${coordinate.componentId}:${slug(name)}:${slug(attribute)}`, name: attribute, expected: want, actual, match };
    });
    return { id: `${coordinate.componentId}:${slug(name)}`, name, status: elementStatus, attributes };
  });
}
