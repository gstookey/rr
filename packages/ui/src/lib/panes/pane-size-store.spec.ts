import { RrPaneSizeStore } from './pane-size-store';

describe('RrPaneSizeStore', () => {
  const KEY = 'rr-panes:test';
  const AB = ['a', 'b'];
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('round-trips a layout', () => {
    const store = new RrPaneSizeStore(KEY);
    store.save([300, 700], AB);
    store.flush();
    expect(new RrPaneSizeStore(KEY).load(AB)).toEqual([300, 700]);
  });

  // WHY: a pointermove fires dozens of times a second. Writing storage on each one is how
  // a drag stutters — the store must coalesce, and still never lose the final position.
  it('coalesces a burst of saves into one write after the settle window', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem');
    const store = new RrPaneSizeStore(KEY, 200);
    for (let i = 0; i < 30; i++) store.save([300 + i, 700 - i], AB);
    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(store.load(AB)).toEqual([329, 671]);
    spy.mockRestore();
  });

  it('flush writes immediately, so a drag end is never lost to the debounce', () => {
    const store = new RrPaneSizeStore(KEY, 10_000);
    store.save([1, 2], AB);
    store.flush();
    expect(store.load(AB)).toEqual([1, 2]);
  });

  // WHY: storage outlives deployments. A layout for a group that has since gained or lost a
  // pane, or a hand-edited value, must be ignored — never rendered.
  it('rejects a stored layout of the wrong shape', () => {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, weights: [1, 2] }));
    expect(new RrPaneSizeStore(KEY).load(['a', 'b', 'c'])).toBeNull();
    localStorage.setItem(KEY, JSON.stringify({ v: 1, weights: [1, -2] }));
    expect(new RrPaneSizeStore(KEY).load(AB)).toBeNull();
    localStorage.setItem(KEY, 'not json');
    expect(new RrPaneSizeStore(KEY).load(AB)).toBeNull();
    localStorage.setItem(KEY, JSON.stringify({ v: 2, weights: [1, 2] }));
    expect(new RrPaneSizeStore(KEY).load(AB)).toBeNull();
  });

  // WHY: weights alone are positional — reorder the panes and every size lands on the wrong
  // one. Saved with ids, a size follows its pane.
  it('restores each weight to the item it was saved with, whatever the order now', () => {
    const store = new RrPaneSizeStore(KEY);
    store.save([300, 700], ['units', 'grid']);
    store.flush();
    expect(store.load(['grid', 'units'])).toEqual([700, 300]);
  });

  it('falls back to position when the ids do not match (or were never saved)', () => {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, weights: [300, 700], ids: ['old-a', 'old-b'] }));
    expect(new RrPaneSizeStore(KEY).load(AB)).toEqual([300, 700]);
    localStorage.setItem(KEY, JSON.stringify({ v: 1, weights: [300, 700] }));
    expect(new RrPaneSizeStore(KEY).load(AB)).toEqual([300, 700]);
  });

  it('treats a storage failure as a silent no-op', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const store = new RrPaneSizeStore(KEY);
    store.save([1, 2], AB);
    expect(() => store.flush()).not.toThrow();
    spy.mockRestore();
  });
});
