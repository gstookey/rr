import type { UnitListItem, UnitPhase, ValidationStatus } from '../../domain';
import { unitAccessibleName, unitWindowSpeech, unitWindowText } from './unit-window';

function item(phase: UnitPhase, startedAt: string, stoppedAt: string | null, status: ValidationStatus = 'VALID'): UnitListItem {
  return { unit: { id: 'u-04', name: 'WTG-04', status, startedAt, stoppedAt }, phase };
}

describe('unit window text', () => {
  it('prints a closed window as start–stop in Zulu', () => {
    const closed = item('complete', '2026-10-01T00:00:00Z', '2026-10-01T23:55:00Z');
    expect(unitWindowText(closed)).toBe('00:00–23:55Z');
    expect(unitWindowSpeech(closed)).toBe('00:00 to 23:55 Zulu');
  });

  it('marks a window that ends on a later UTC day with +Nd', () => {
    const overnight = item('complete', '2026-09-30T22:00:00Z', '2026-10-01T04:00:00Z');
    const long = item('complete', '2026-09-29T22:00:00Z', '2026-10-01T04:00:00Z');
    expect(unitWindowText(overnight)).toBe('22:00–04:00Z +1d');
    expect(unitWindowSpeech(overnight)).toBe('22:00 to 04:00 Zulu, next day');
    expect(unitWindowText(long)).toBe('22:00–04:00Z +2d');
    expect(unitWindowSpeech(long)).toBe('22:00 to 04:00 Zulu, 2 days later');
  });

  it('prints an open window as its start and "running"', () => {
    const running = item('running', '2026-10-01T06:00:00Z', null);
    expect(unitWindowText(running)).toBe('06:00Z · running');
    expect(unitWindowSpeech(running)).toBe('from 06:00 Zulu, running');
  });

  it('reads a window with no stop as running, whatever the phase says', () => {
    expect(unitWindowText(item('complete', '2026-10-01T06:00:00Z', null))).toBe('06:00Z · running');
  });

  it('prints a future window as "scheduled" and its start', () => {
    const scheduled = item('scheduled', '2026-10-01T18:00:00Z', null);
    expect(unitWindowText(scheduled)).toBe('scheduled 18:00Z');
    expect(unitWindowSpeech(scheduled)).toBe('scheduled 18:00 Zulu');
  });

  it('names an option by unit, status and window', () => {
    expect(unitAccessibleName(item('complete', '2026-10-01T00:00:00Z', '2026-10-01T23:55:00Z', 'INVALID'))).toBe(
      'WTG-04, Invalid, 00:00 to 23:55 Zulu',
    );
  });
});
