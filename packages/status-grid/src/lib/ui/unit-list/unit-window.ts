import { STATUS_LABEL, formatZuluTime, type UnitListItem } from '../../domain';

/**
 * A unit's test window as the Unit List prints it and as a screen reader says it.
 *
 * Created: 2026-10-01
 *
 * Pure: no Angular, no clock. The PHASE comes in with the item (the store computes it against
 * `now`), so these functions only format. Everything is UTC — the feature speaks Zulu.
 */

const DAY_MS = 86_400_000;

/** The word an open window ends with. The row lights it in primary ink. */
export const RUNNING = 'running';

/** '04:15' — a Zulu time without its Z, for speech ("04:15 Zulu"). */
function clock(ms: number): string {
  return formatZuluTime(ms).slice(0, -1);
}

/** How many UTC midnights lie between two instants: 0 when both fall on the same UTC day. */
function daysSpanned(startMs: number, stopMs: number): number {
  return Math.floor(stopMs / DAY_MS) - Math.floor(startMs / DAY_MS);
}

/**
 * The window text of one row:
 *  - closed     `00:00–23:55Z`, plus ` +1d` (` +Nd`) when the stop falls on a later UTC day;
 *  - running    `06:00Z · running`;
 *  - scheduled  `scheduled 18:00Z`.
 *
 * A window with no stop reads as running whatever the phase says: there is no end to print.
 */
export function unitWindowText({ unit, phase }: UnitListItem): string {
  const start = Date.parse(unit.startedAt);
  if (phase === 'scheduled') return `scheduled ${formatZuluTime(start)}`;
  if (phase === 'running' || unit.stoppedAt === null) return `${formatZuluTime(start)} · ${RUNNING}`;
  const stop = Date.parse(unit.stoppedAt);
  const days = daysSpanned(start, stop);
  return `${clock(start)}–${formatZuluTime(stop)}${days > 0 ? ` +${days}d` : ''}`;
}

/** The same window in words: `00:00 to 23:55 Zulu`, `…, next day`, `from 06:00 Zulu, running`,
 *  `scheduled 18:00 Zulu`. "–", "·" and "+1d" are not things a screen reader says well. */
export function unitWindowSpeech({ unit, phase }: UnitListItem): string {
  const start = Date.parse(unit.startedAt);
  if (phase === 'scheduled') return `scheduled ${clock(start)} Zulu`;
  if (phase === 'running' || unit.stoppedAt === null) return `from ${clock(start)} Zulu, ${RUNNING}`;
  const stop = Date.parse(unit.stoppedAt);
  const days = daysSpanned(start, stop);
  const later = days === 1 ? ', next day' : days > 1 ? `, ${days} days later` : '';
  return `${clock(start)} to ${clock(stop)} Zulu${later}`;
}

/** An option's accessible name: "WTG-04, Invalid, 00:00 to 23:55 Zulu". */
export function unitAccessibleName(item: UnitListItem): string {
  return `${item.unit.name}, ${STATUS_LABEL[item.unit.status]}, ${unitWindowSpeech(item)}`;
}
