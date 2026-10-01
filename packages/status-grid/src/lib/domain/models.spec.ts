import { sameCoordinate, unitPhase, type Unit } from './models';

describe('sameCoordinate', () => {
  const a = { componentId: 'gearbox', timestamp: '2026-10-01T04:15:00Z' };

  it('compares by component and timestamp, not by object', () => {
    expect(sameCoordinate(a, { ...a })).toBe(true);
    expect(sameCoordinate(a, { ...a, componentId: 'tower' })).toBe(false);
    expect(sameCoordinate(a, { ...a, timestamp: '2026-10-01T04:30:00Z' })).toBe(false);
  });

  it('treats null as equal only to null', () => {
    expect(sameCoordinate(null, null)).toBe(true);
    expect(sameCoordinate(a, null)).toBe(false);
    expect(sameCoordinate(null, a)).toBe(false);
  });
});

describe('unitPhase', () => {
  const now = Date.parse('2026-10-01T12:00:00Z');
  const unit = (startedAt: string, stoppedAt: string | null): Unit =>
    ({ id: 'u', name: 'u', status: 'VALID', startedAt, stoppedAt });

  it('is scheduled before the window opens', () => {
    expect(unitPhase(unit('2026-10-02T00:00:00Z', null), now)).toBe('scheduled');
  });

  it('is running while the window is open, or closes in the future', () => {
    expect(unitPhase(unit('2026-10-01T00:00:00Z', null), now)).toBe('running');
    expect(unitPhase(unit('2026-10-01T00:00:00Z', '2026-10-01T18:00:00Z'), now)).toBe('running');
  });

  it('is complete once the window has closed', () => {
    expect(unitPhase(unit('2026-09-30T00:00:00Z', '2026-10-01T00:00:00Z'), now)).toBe('complete');
  });
});
