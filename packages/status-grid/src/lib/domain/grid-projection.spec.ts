import { buildGridRows, countElapsed, locate, worstByHour } from './grid-projection';
import type { UnitGrid } from './models';
import { buildTimeAxis } from './time-axis';

const T = ['2026-10-01T04:00:00Z', '2026-10-01T04:30:00Z', '2026-10-01T05:00:00Z', '2026-10-01T05:30:00Z'];
const axis = buildTimeAxis(T);

const grid: UnitGrid = {
  unitId: 'WTG-01',
  components: [
    { id: 'gearbox', name: 'Gearbox' },
    { id: 'converter', name: 'Converter' },
  ],
  timestamps: T,
  samples: [
    { componentId: 'gearbox', timestamp: T[0], status: 'VALID' },
    { componentId: 'gearbox', timestamp: T[1], status: 'PARTIAL' },
    // a sample "from the future" — the unit's clock runs a little ahead of ours
    { componentId: 'gearbox', timestamp: T[3], status: 'INVALID' },
  ],
  failedComponentIds: ['converter'],
};

describe('buildGridRows', () => {
  // two columns elapsed (04:00, 04:30), two in the future
  const rows = buildGridRows(axis, grid, 2);

  it('decides every cell: sample, then ERROR for a failed component, then NO_DATA, then PENDING', () => {
    expect(rows[0].cells).toEqual(['VALID', 'PARTIAL', 'NO_DATA', 'INVALID']);
    expect(rows[1].cells).toEqual(['ERROR', 'ERROR', 'NO_DATA', 'NO_DATA']);
  });

  // WHY: data beats the clock — real results must never be replaced by hyphens because two
  // clocks disagree.
  it('shows a real sample even when its time is in the future', () => {
    expect(rows[0].cells[3]).toBe('INVALID');
  });

  it('marks an elapsed cell with no sample PENDING', () => {
    expect(buildGridRows(axis, grid, 3)[0].cells[2]).toBe('PENDING');
  });

  it('rolls each row up over its ELAPSED cells only', () => {
    expect(rows[0].rollup).toBe('PARTIAL'); // the future INVALID does not count yet
    expect(rows[1].rollup).toBe('ERROR');
  });

  // The axis treats two spellings of one instant as one column; the samples must land on it too.
  it('matches a sample to its column by instant, whatever the spelling', () => {
    const spelled: UnitGrid = { ...grid, samples: [{ componentId: 'gearbox', timestamp: '2026-10-01T04:00:00.000Z', status: 'INVALID' }] };
    expect(buildGridRows(axis, spelled, 2)[0].cells[0]).toBe('INVALID');
  });

  it('has no rows without a grid', () => {
    expect(buildGridRows(axis, null, 2)).toEqual([]);
  });
});

describe('counting', () => {
  const rows = buildGridRows(axis, grid, 2);

  // WHY: a half-finished day is not half-failing. Only elapsed cells count, and NO_DATA never.
  it('counts elapsed cells per status, never NO_DATA', () => {
    const counts = countElapsed(rows, 2);
    expect(counts).toEqual({ VALID: 1, PARTIAL: 1, INVALID: 0, ERROR: 2, PENDING: 0, NO_DATA: 0 });
  });

  it('stops at the row length when the boundary is past the end', () => {
    // the future INVALID counts once elapsed; the three NO_DATA cells never do
    expect(countElapsed(rows, 99)).toEqual({ VALID: 1, PARTIAL: 1, INVALID: 1, ERROR: 2, PENDING: 0, NO_DATA: 0 });
  });

  it('gives each hour its worst elapsed status, for the day ribbon', () => {
    expect(worstByHour(axis, rows, 2)).toEqual(['PARTIAL', 'NO_DATA']);
    expect(worstByHour(axis, buildGridRows(axis, grid, 4), 4)).toEqual(['PARTIAL', 'INVALID']);
  });
});

describe('locate', () => {
  const rows = buildGridRows(axis, grid, 2);

  it('finds a coordinate on the grid', () => {
    expect(locate({ componentId: 'converter', timestamp: T[2] }, axis, rows)).toEqual({ row: 1, column: 2 });
  });

  it('is null for no coordinate, an unknown component, or an unknown time', () => {
    expect(locate(null, axis, rows)).toBeNull();
    expect(locate({ componentId: 'tower', timestamp: T[0] }, axis, rows)).toBeNull();
    expect(locate({ componentId: 'gearbox', timestamp: '2026-10-01T09:00:00Z' }, axis, rows)).toBeNull();
  });
});
