import { buildTrackList, gapLine, itemLine, itemTrack } from './tracks';

const flex = { basis: { unit: 'fr', value: 1 }, collapsedSize: 30, min: 80 } as const;
const fixed = { basis: { unit: 'px', value: 280 }, collapsedSize: 30, min: 80 } as const;

describe('itemTrack', () => {
  it('renders a flex item as a weighted fr track with its floor', () => {
    expect(itemTrack({ ...flex, weight: 70, collapsed: false })).toBe('minmax(80px, 70fr)');
  });

  it('renders a fixed item as a px track that holds its size', () => {
    expect(itemTrack({ ...fixed, weight: 280, collapsed: false })).toBe('minmax(80px, 280px)');
  });

  it('renders a collapsed item at exactly its collapsed size', () => {
    expect(itemTrack({ ...flex, weight: 70, collapsed: true })).toBe('minmax(30px, 0fr)');
    expect(itemTrack({ ...fixed, weight: 280, collapsed: true })).toBe('minmax(30px, 0px)');
  });

  // WHY: a track only animates if it keeps its type. Browser-verified: `minmax(px,fr)` to a
  // plain `px` snaps silently. This pins that no item ever changes type on collapse.
  it('never changes a track type between collapsed and expanded', () => {
    const type = (t: string) => t.replace(/[\d.]+/g, '#');
    expect(type(itemTrack({ ...flex, weight: 70, collapsed: true })))
      .toBe(type(itemTrack({ ...flex, weight: 70, collapsed: false })));
    expect(type(itemTrack({ ...fixed, weight: 280, collapsed: true })))
      .toBe(type(itemTrack({ ...fixed, weight: 280, collapsed: false })));
  });
});

describe('buildTrackList', () => {
  it('interleaves a gap track between items and none at the ends', () => {
    expect(buildTrackList([{ ...fixed, weight: 280, collapsed: false }, { ...flex, weight: 1, collapsed: false }], 8))
      .toBe('minmax(80px, 280px) 8px minmax(80px, 1fr)');
  });

  it('places item i and the gap after it on predictable grid lines', () => {
    expect([itemLine(0), gapLine(0), itemLine(1), gapLine(1), itemLine(2)]).toEqual([1, 2, 3, 4, 5]);
  });
});
