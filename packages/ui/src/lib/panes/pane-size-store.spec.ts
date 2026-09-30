import { RrPaneSizeStore } from './pane-size-store';
import { ManualClock, define, patch, recorder, restorePatches } from './testing/panes-testing';

describe('RrPaneSizeStore', () => {
  const KEY = 'rr-panes:test';
  const AB = ['a', 'b'];
  let clock: ManualClock;

  beforeEach(() => {
    localStorage.clear();
    clock = new ManualClock().install();
  });
  afterEach(() => restorePatches());

  it('round-trips a layout', () => {
    const store = new RrPaneSizeStore(KEY);
    store.save([300, 700], AB);
    store.flush();
    expect(new RrPaneSizeStore(KEY).load(AB)).toEqual([300, 700]);
  });

  it('rounds weights to two decimals when it writes them', () => {
    const store = new RrPaneSizeStore(KEY);
    store.save([300.123456, 699.876544], AB);
    store.flush();
    expect(JSON.parse(localStorage.getItem(KEY) ?? 'null')).toEqual({ v: 1, weights: [300.12, 699.88], ids: AB });
  });

  // WHY: a pointermove fires dozens of times a second. Writing storage on each one is how
  // a drag stutters — the store must coalesce, and still never lose the final position.
  it('coalesces a burst of saves into one write after the settle window', () => {
    const setItem = recorder(Storage.prototype.setItem);
    patch(Storage.prototype, 'setItem', setItem);
    const store = new RrPaneSizeStore(KEY, 200);
    for (let i = 0; i < 30; i++) store.save([300 + i, 700 - i], AB);
    clock.advance(199);
    expect(setItem.calls).toHaveLength(0);
    clock.advance(1);
    expect(setItem.calls).toHaveLength(1);
    expect(store.load(AB)).toEqual([329, 671]);
  });

  it('flush writes immediately, so a drag end is never lost to the debounce', () => {
    const setItem = recorder(Storage.prototype.setItem);
    patch(Storage.prototype, 'setItem', setItem);
    const store = new RrPaneSizeStore(KEY, 10_000);
    store.save([1, 2], AB);
    store.flush();
    expect(store.load(AB)).toEqual([1, 2]);
    clock.advance(10_000); // the cancelled timer never writes a second time
    expect(setItem.calls).toHaveLength(1);
  });

  it('writes nothing when flushed with nothing pending', () => {
    const setItem = recorder(Storage.prototype.setItem);
    patch(Storage.prototype, 'setItem', setItem);
    new RrPaneSizeStore(KEY).flush();
    expect(setItem.calls).toHaveLength(0);
  });

  // WHY: storage outlives deployments. A layout for a group that has since gained or lost a
  // pane, or a hand-edited value, must be ignored — never rendered.
  it('rejects a stored layout of the wrong shape', () => {
    expect(new RrPaneSizeStore(KEY).load(AB)).toBeNull(); // nothing stored
    localStorage.setItem(KEY, JSON.stringify({ v: 1, weights: [1, 2] }));
    expect(new RrPaneSizeStore(KEY).load(['a', 'b', 'c'])).toBeNull();
    localStorage.setItem(KEY, JSON.stringify({ v: 1, weights: [1, -2] }));
    expect(new RrPaneSizeStore(KEY).load(AB)).toBeNull();
    localStorage.setItem(KEY, 'not json');
    expect(new RrPaneSizeStore(KEY).load(AB)).toBeNull();
    localStorage.setItem(KEY, JSON.stringify({ v: 2, weights: [1, 2] }));
    expect(new RrPaneSizeStore(KEY).load(AB)).toBeNull();
    localStorage.setItem(KEY, 'null');
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

  it('clears a stored layout and anything still settling', () => {
    const store = new RrPaneSizeStore(KEY);
    store.save([1, 2], AB);
    store.flush();
    store.save([3, 4], AB);
    store.clear();
    clock.advance(1_000);
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(() => store.clear()).not.toThrow(); // nothing pending, nothing stored
  });

  // WHY: private mode, quota and disabled storage are not errors the operator can act on.
  describe('treats every storage failure as a silent no-op', () => {
    it('when writing', () => {
      patch(Storage.prototype, 'setItem', () => {
        throw new Error('QuotaExceededError');
      });
      const store = new RrPaneSizeStore(KEY);
      store.save([1, 2], AB);
      expect(() => store.flush()).not.toThrow();
    });

    it('when removing', () => {
      patch(Storage.prototype, 'removeItem', () => {
        throw new Error('SecurityError');
      });
      expect(() => new RrPaneSizeStore(KEY).clear()).not.toThrow();
    });

    it('when merely touching localStorage throws (storage disabled)', () => {
      define(globalThis, 'localStorage', {
        get: () => {
          throw new Error('SecurityError');
        },
      });
      const store = new RrPaneSizeStore(KEY);
      expect(store.load(AB)).toBeNull();
      store.save([1, 2], AB);
      expect(() => store.flush()).not.toThrow();
      expect(() => store.clear()).not.toThrow();
    });

    // WHY: server rendering — there is no localStorage at all, and some hosts define it null.
    it('when there is no storage at all', () => {
      for (const absent of [undefined, null]) {
        define(globalThis, 'localStorage', { value: absent, writable: true });
        const store = new RrPaneSizeStore(KEY);
        expect(store.load(AB)).toBeNull();
        store.save([1, 2], AB);
        expect(() => store.flush()).not.toThrow();
        expect(() => store.clear()).not.toThrow();
        restorePatches();
        clock = new ManualClock().install();
      }
    });
  });
});
