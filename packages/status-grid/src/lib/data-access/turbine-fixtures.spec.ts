import { buildGridRows, buildTimeAxis, elapsedColumnCount } from '../domain';
import { createTurbineFixtures } from './turbine-fixtures';

const NOW = Date.parse('2026-10-01T14:05:00Z');

describe('createTurbineFixtures', () => {
  const data = createTurbineFixtures({ now: NOW });

  it('is deterministic for the same clock and seed', () => {
    const again = createTurbineFixtures({ now: NOW, seed: 7 });
    expect(again.units()).toEqual(data.units());
    expect(again.unitGrid('WTG-02')).toEqual(data.unitGrid('WTG-02'));
    expect(createTurbineFixtures({ now: NOW, seed: 8 }).unitGrid('WTG-02')).not.toEqual(data.unitGrid('WTG-02'));
  });

  it('has fourteen units: running, complete, scheduled and overnight windows', () => {
    const units = data.units();
    expect(units.map((u) => u.id)).toEqual(Array.from({ length: 14 }, (_, i) => `WTG-${String(i + 1).padStart(2, '0')}`));
    expect(units[0]).toMatchObject({ startedAt: '2026-10-01T00:00:00Z', stoppedAt: null });
    expect(units[10].stoppedAt).toBe('2026-10-01T00:00:00Z');
    expect(units[12]).toMatchObject({ startedAt: '2026-10-02T06:00:00Z', status: 'NO_DATA' });
    expect(units[13]).toMatchObject({ startedAt: '2026-09-30T18:00:00Z', stoppedAt: '2026-10-01T06:00:00Z' });
  });

  it('has an irregular 10–15 minute cadence', () => {
    const t = (data.unitGrid('WTG-01')?.timestamps ?? []).map(Date.parse);
    const steps = new Set(t.slice(1).map((ms, i) => (ms - t[i]) / 60_000));
    expect([...steps].every((m) => [10, 12, 15].includes(m))).toBe(true);
    expect(steps.size).toBeGreaterThan(1);
  });

  it('fails the Converter on WTG-04 and gives WTG-07 twenty components', () => {
    expect(data.unitGrid('WTG-04')?.failedComponentIds).toEqual(['converter']);
    expect(data.unitGrid('WTG-04')?.samples.some((s) => s.componentId === 'converter')).toBe(false);
    expect(data.unitGrid('WTG-07')?.components).toHaveLength(20);
  });

  it('only has samples that have had time to arrive, so the newest elapsed cells are PENDING', () => {
    const grid = data.unitGrid('WTG-01');
    expect(grid?.samples.every((s) => Date.parse(s.timestamp) <= NOW - 25 * 60_000)).toBe(true);
    const axis = buildTimeAxis(grid?.timestamps ?? []);
    const rows = buildGridRows(axis, grid ?? null, elapsedColumnCount(axis, NOW));
    expect(rows[0].cells).toContain('PENDING');
    expect(rows[0].cells).toContain('NO_DATA');
  });

  it('rolls each unit up from its own samples', () => {
    expect(data.units().find((u) => u.id === 'WTG-04')?.status).toMatch(/INVALID|PARTIAL|ERROR/);
  });

  it('returns nothing for an unknown unit or a coordinate with no sample', () => {
    expect(data.unitGrid('nope')).toBeNull();
    expect(data.sampleDetail('nope', { componentId: 'gearbox', timestamp: 'x' })).toEqual([]);
    expect(data.sampleDetail('WTG-01', { componentId: 'gearbox', timestamp: '2026-10-01T23:50:00Z' })).toEqual([]);
  });

  describe('sample detail', () => {
    const grid = data.unitGrid('WTG-03');
    const detailOf = (status: string) => {
      const sample = grid?.samples.find((s) => s.status === status);
      return sample ? data.sampleDetail('WTG-03', sample) : [];
    };

    it('has seven elements of eight attributes, with stable ids per component', () => {
      const detail = detailOf('VALID');
      expect(detail).toHaveLength(7);
      expect(detail.every((e) => e.attributes.length === 8)).toBe(true);
      expect(detail[0].id).toMatch(/^[a-z-]+:oil-temp-probe$/);
    });

    it('agrees with the sample: VALID matches everything', () => {
      const detail = detailOf('VALID');
      expect(detail.every((e) => e.status === 'VALID' && e.attributes.every((a) => a.match === 'MATCH'))).toBe(true);
    });

    it('agrees with the sample: INVALID has a mismatching element', () => {
      const flagged = detailOf('INVALID').filter((e) => e.status === 'INVALID');
      expect(flagged.length).toBeGreaterThan(0);
      expect(flagged.every((e) => e.attributes.some((a) => a.match === 'MISMATCH' && a.actual !== a.expected))).toBe(true);
    });

    it('can mismatch the unit of measure itself (°F where °C was expected)', () => {
      const units = data.units().flatMap((u) =>
        (data.unitGrid(u.id)?.samples ?? [])
          .filter((s) => s.status === 'INVALID')
          .flatMap((s) => data.sampleDetail(u.id, s))
          .flatMap((e) => e.attributes)
          .filter((a) => a.name === 'Units' && a.match === 'MISMATCH'),
      );
      expect(units.length).toBeGreaterThan(0);
      expect(units.every((a) => a.actual !== a.expected && a.actual !== null)).toBe(true);
    });

    it('agrees with the sample: PARTIAL has an element with a value not received', () => {
      const flagged = detailOf('PARTIAL').filter((e) => e.status === 'PARTIAL');
      expect(flagged.length).toBeGreaterThan(0);
      expect(flagged.every((e) => e.attributes.some((a) => a.match === 'MISSING' && a.actual === null))).toBe(true);
    });
  });
});
