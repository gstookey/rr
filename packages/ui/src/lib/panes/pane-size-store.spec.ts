import { RrPaneSizeStore } from './pane-size-store';

describe('RrPaneSizeStore', () => {
  const KEY = 'rr-panes:test';
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('round-trips a layout', () => {
    const store = new RrPaneSizeStore(KEY);
    store.save([300, 700]);
    store.flush();
    expect(new RrPaneSizeStore(KEY).load(2)).toEqual([300, 700]);
  });

  // WHY: a pointermove fires dozens of times a second. Writing storage on each one is how
  // a drag stutters — the store must coalesce, and still never lose the final position.
  it('coalesces a burst of saves into one write after the settle window', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem');
    const store = new RrPaneSizeStore(KEY, 200);
    for (let i = 0; i < 30; i++) store.save([300 + i, 700 - i]);
    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(store.load(2)).toEqual([329, 671]);
    spy.mockRestore();
  });

  it('flush writes immediately, so a drag end is never lost to the debounce', () => {
    const store = new RrPaneSizeStore(KEY, 10_000);
    store.save([1, 2]);
    store.flush();
    expect(store.load(2)).toEqual([1, 2]);
  });

  // WHY: storage outlives deployments. A layout for a group that has since gained or lost a
  // pane, or a hand-edited value, must be ignored — never rendered.
  it('rejects a stored layout of the wrong shape', () => {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, weights: [1, 2] }));
    expect(new RrPaneSizeStore(KEY).load(3)).toBeNull();
    localStorage.setItem(KEY, JSON.stringify({ v: 1, weights: [1, -2] }));
    expect(new RrPaneSizeStore(KEY).load(2)).toBeNull();
    localStorage.setItem(KEY, 'not json');
    expect(new RrPaneSizeStore(KEY).load(2)).toBeNull();
    localStorage.setItem(KEY, JSON.stringify({ v: 2, weights: [1, 2] }));
    expect(new RrPaneSizeStore(KEY).load(2)).toBeNull();
  });

  it('treats a storage failure as a silent no-op', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const store = new RrPaneSizeStore(KEY);
    store.save([1, 2]);
    expect(() => store.flush()).not.toThrow();
    spy.mockRestore();
  });
});
