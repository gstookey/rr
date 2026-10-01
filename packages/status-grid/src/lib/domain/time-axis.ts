import type { Iso8601 } from './models';

/**
 * The grid's time axis: one column per sample timestamp, grouped into hours for the header.
 *
 * Created: 2026-10-01
 *
 * RULINGS this encodes (R1/R2):
 *  • One column per timestamp, all the same width. Irregular cadence shows up ONLY as hour groups
 *    of different spans — nothing maps elapsed time to width.
 *  • Hour groups are CONSECUTIVE RUNS, keyed `hourKey#startIndex`, and their spans tile the axis
 *    exactly. (A Map keyed on the hour would merge two non-adjacent runs of the same hour and
 *    shear the header off its columns.)
 *  • Everything is UTC — the feature speaks Zulu.
 */

const HOUR_MS = 3_600_000;
const pad2 = (n: number): string => String(n).padStart(2, '0');

/** '04:15Z' */
export function formatZuluTime(ms: number): string {
  const d = new Date(ms);
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}Z`;
}

/** '10-01 04:15Z' — for windows that may span days. */
export function formatZuluDayTime(ms: number): string {
  const d = new Date(ms);
  return `${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${formatZuluTime(ms)}`;
}

export interface TimeColumn {
  readonly index: number;
  readonly timestamp: Iso8601;
  readonly epochMs: number;
  /** Two-digit minute; the hour comes from the tier above. */
  readonly minuteLabel: string;
  /** First column of its hour group. */
  readonly startsHour: boolean;
  /** Whether the minute tier prints this column's label (see buildMinuteLabelMask). */
  readonly showMinute: boolean;
}

export interface HourGroup {
  /** `${hourKey}#${startIndex}` — never the bare hour, which can recur. */
  readonly id: string;
  /** '14:00' */
  readonly label: string;
  readonly startIndex: number;
  /** Variable. The spans sum to the column count. */
  readonly span: number;
}

export interface TimeAxis {
  readonly columns: readonly TimeColumn[];
  readonly hourGroups: readonly HourGroup[];
  readonly indexByTimestamp: ReadonlyMap<Iso8601, number>;
}

export const EMPTY_AXIS: TimeAxis = { columns: [], hourGroups: [], indexByTimestamp: new Map() };

/**
 * Build the axis from an irregular timestamp list.
 *
 *  - order is not trusted: columns are sorted by INSTANT (ISO strings only sort correctly when
 *    uniformly formatted);
 *  - a duplicate instant is dropped, whatever its spelling (two columns at one instant would
 *    inflate a span and shear the header);
 *  - an unparseable entry is dropped rather than poisoning the axis with NaN.
 */
export function buildTimeAxis(timestamps: readonly Iso8601[]): TimeAxis {
  const seen = new Set<number>();
  const parsed: { timestamp: Iso8601; epochMs: number }[] = [];
  for (const timestamp of timestamps) {
    const epochMs = Date.parse(timestamp);
    if (Number.isNaN(epochMs) || seen.has(epochMs)) continue;
    seen.add(epochMs);
    parsed.push({ timestamp, epochMs });
  }
  parsed.sort((a, b) => a.epochMs - b.epochMs);

  const hourGroups: { id: string; label: string; startIndex: number; span: number; hour: number }[] = [];
  const starts: boolean[] = [];
  parsed.forEach(({ epochMs }, index) => {
    const hour = Math.floor(epochMs / HOUR_MS);
    const current = hourGroups[hourGroups.length - 1];
    const startsHour = current === undefined || current.hour !== hour;
    if (startsHour) {
      hourGroups.push({ id: `${hour}#${index}`, label: `${pad2(new Date(epochMs).getUTCHours())}:00`, startIndex: index, span: 0, hour });
    }
    hourGroups[hourGroups.length - 1].span += 1;
    starts.push(startsHour);
  });

  const mask = buildMinuteLabelMask(starts);
  const columns: TimeColumn[] = parsed.map(({ timestamp, epochMs }, index) => ({
    index,
    timestamp,
    epochMs,
    minuteLabel: pad2(new Date(epochMs).getUTCMinutes()),
    startsHour: starts[index],
    showMinute: mask[index],
  }));

  return {
    columns,
    hourGroups: hourGroups.map(({ id, label, startIndex, span }) => ({ id, label, startIndex, span })),
    indexByTimestamp: new Map(columns.map((c) => [c.timestamp, c.index])),
  };
}

/**
 * Which columns print a minute label. Labels need two columns of clearance (36px at an 18px cell —
 * room for a 2-digit minute at 10px), and an hour's first column is ALWAYS labelled: when an hour
 * start lands one column after an ordinary label, the ordinary label gives way. Two adjacent hour
 * starts (a one-column hour) are the one accepted exception — the hour tier above disambiguates.
 */
export function buildMinuteLabelMask(startsHour: readonly boolean[]): boolean[] {
  const mask = [...startsHour];
  let last = -Infinity;
  for (let i = 0; i < startsHour.length; i++) {
    if (startsHour[i]) {
      if (i - last < 2 && !startsHour[last]) mask[last] = false;
      last = i;
    } else if (i - last >= 2) {
      mask[i] = true;
      last = i;
    }
  }
  return mask;
}

/**
 * How many columns are in the past at `nowMs` — the index of the first FUTURE column.
 *
 * Everything time-dependent keys off this INTEGER, never off `now` itself: `now` ticks every 30s,
 * the integer only changes when the boundary crosses a column (≤ ~150 times a day), and signals
 * compare by value — so the grid recomputes when something visible changes, not on every tick.
 */
export function elapsedColumnCount(axis: TimeAxis, nowMs: number): number {
  const columns = axis.columns;
  let lo = 0;
  let hi = columns.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (columns[mid].epochMs <= nowMs) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
