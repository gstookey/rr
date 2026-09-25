import { buildTrackList, gapLine, itemLine, itemTrack } from './tracks';

const expanded = { collapsed: false, collapsedSize: 30, min: 80 } as const;

describe('itemTrack', () => {
  it('renders a collapsed item at its collapsed size, contributing no flex', () => {
    expect(itemTrack({ ...expanded, collapsed: true, weight: 480, basis: { unit: 'fr', value: 1 } }))
      .toBe('minmax(30px, 0fr)');
  });

  it('renders a measured item as a weighted fr track with its floor', () => {
    expect(itemTrack({ ...expanded, weight: 480, basis: { unit: 'fr', value: 1 } }))
      .toBe('minmax(80px, 480fr)');
  });

  // WHY: before measurement the declared basis is rendered as real CSS, so the first paint
  // and server-side rendering are already correct.
  it('renders the declared basis natively before the group has measured', () => {
    expect(itemTrack({ ...expanded, weight: null, basis: { unit: '%', value: 30 } })).toBe('minmax(80px, 30%)');
    expect(itemTrack({ ...expanded, weight: null, basis: { unit: 'px', value: 240 } })).toBe('minmax(80px, 240px)');
  });

  // WHY: collapse only animates if both sides are minmax(length, fr). This pins the shape.
  it('gives collapsed and measured tracks the same interpolable shape', () => {
    const shape = /^minmax\(\d+(\.\d+)?px, \d+(\.\d+)?fr\)$/;
    expect(itemTrack({ ...expanded, collapsed: true, weight: 480, basis: { unit: 'fr', value: 1 } })).toMatch(shape);
    expect(itemTrack({ ...expanded, weight: 480, basis: { unit: 'fr', value: 1 } })).toMatch(shape);
  });
});

describe('buildTrackList', () => {
  it('interleaves a gap track between items and none at the ends', () => {
    const list = buildTrackList(
      [
        { ...expanded, weight: 300, basis: { unit: 'fr', value: 1 } },
        { ...expanded, weight: 700, basis: { unit: 'fr', value: 1 } },
      ],
      8,
    );
    expect(list).toBe('minmax(80px, 300fr) 8px minmax(80px, 700fr)');
  });

  it('places item i and the gap after it on predictable grid lines', () => {
    expect([itemLine(0), gapLine(0), itemLine(1), gapLine(1), itemLine(2)]).toEqual([1, 2, 3, 4, 5]);
  });
});
