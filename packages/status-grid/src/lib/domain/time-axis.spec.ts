import {
  EMPTY_AXIS,
  buildMinuteLabelMask,
  buildTimeAxis,
  elapsedColumnCount,
  formatZuluDayTime,
  formatZuluTime,
} from './time-axis';

describe('Zulu formatting', () => {
  it('formats a time, and a day and time, in UTC', () => {
    const ms = Date.parse('2026-10-01T04:05:00Z');
    expect(formatZuluTime(ms)).toBe('04:05Z');
    expect(formatZuluDayTime(ms)).toBe('10-01 04:05Z');
  });
});

describe('buildTimeAxis', () => {
  it('makes one column per timestamp, sorted by instant', () => {
    const axis = buildTimeAxis(['2026-10-01T04:20:00Z', '2026-10-01T04:00:00Z', '2026-10-01T04:10:00Z']);
    expect(axis.columns.map((c) => c.minuteLabel)).toEqual(['00', '10', '20']);
    expect(axis.columns.map((c) => c.index)).toEqual([0, 1, 2]);
    expect(axis.indexByTimestamp.get('2026-10-01T04:10:00Z')).toBe(1);
  });

  // WHY: a duplicate instant inflates a span and shears the header off its columns.
  it('drops duplicate instants, however they are spelled, and unparseable entries', () => {
    const axis = buildTimeAxis(['2026-10-01T04:00:00Z', '2026-10-01T04:00:00.000Z', 'not a time', '2026-10-01T04:15:00Z']);
    expect(axis.columns.map((c) => c.timestamp)).toEqual(['2026-10-01T04:00:00Z', '2026-10-01T04:15:00Z']);
  });

  // WHY: irregular cadence shows up only as hour groups of different spans, and the spans must
  // add up to the columns exactly, or the hour labels drift off the minutes beneath them.
  it('groups consecutive columns into hours of variable span that tile the axis', () => {
    const axis = buildTimeAxis([
      '2026-10-01T23:30:00Z', '2026-10-01T23:45:00Z',
      '2026-10-02T00:00:00Z', '2026-10-02T00:12:00Z', '2026-10-02T00:24:00Z',
      '2026-10-02T01:05:00Z',
    ]);
    expect(axis.hourGroups.map((g) => [g.label, g.startIndex, g.span])).toEqual([
      ['23:00', 0, 2],
      ['00:00', 2, 3],
      ['01:00', 5, 1],
    ]);
    expect(axis.hourGroups.reduce((sum, g) => sum + g.span, 0)).toBe(axis.columns.length);
    expect(new Set(axis.hourGroups.map((g) => g.id)).size).toBe(3);
    expect(axis.columns.map((c) => c.startsHour)).toEqual([true, false, true, false, false, true]);
  });

  it('is empty for no timestamps', () => {
    expect(buildTimeAxis([])).toEqual({ ...EMPTY_AXIS, indexByTimestamp: new Map() });
  });
});

describe('buildMinuteLabelMask', () => {
  it('labels every other column', () => {
    expect(buildMinuteLabelMask([true, false, false, false, false])).toEqual([true, false, true, false, true]);
  });

  it('always labels an hour start, dropping an ordinary label right before it', () => {
    expect(buildMinuteLabelMask([true, false, true, false])).toEqual([true, false, true, false]);
    expect(buildMinuteLabelMask([true, false, false, true])).toEqual([true, false, false, true]);
  });

  it('keeps two adjacent hour starts — the one accepted crowding', () => {
    expect(buildMinuteLabelMask([true, true, false])).toEqual([true, true, false]);
  });
});

describe('elapsedColumnCount', () => {
  const axis = buildTimeAxis(['2026-10-01T04:00:00Z', '2026-10-01T04:10:00Z', '2026-10-01T04:20:00Z']);
  const at = (iso: string) => elapsedColumnCount(axis, Date.parse(iso));

  it('counts the columns at or before now', () => {
    expect(at('2026-10-01T03:59:00Z')).toBe(0);
    expect(at('2026-10-01T04:00:00Z')).toBe(1);
    expect(at('2026-10-01T04:15:00Z')).toBe(2);
    expect(at('2026-10-01T05:00:00Z')).toBe(3);
  });
});
