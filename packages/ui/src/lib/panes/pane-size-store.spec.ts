import { RrPaneSizeStore } from './pane-size-store';

describe('RrPaneSizeStore', () => {
  const KEY = 'rr-panes:test';
  const IDS = ['a', 'b'];

  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('saves and loads a layout', () => {
    const store = new RrPaneSizeStore(KEY);
    store.save([300, 700], IDS);
    store.flush();

    expect(store.load(IDS)).toEqual([300, 700]);
  });

  it('stores weights rounded to two decimals, with the item ids', () => {
    const store = new RrPaneSizeStore(KEY);
    store.save([300.123, 699.877], IDS);
    store.flush();

    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({ v: 1, weights: [300.12, 699.88], ids: IDS });
  });

  it('waits for the settle time and writes a burst of saves once', () => {
    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    const store = new RrPaneSizeStore(KEY, 200);

    for (let i = 0; i < 30; i++) store.save([300 + i, 700 - i], IDS);
    jest.advanceTimersByTime(199);
    expect(setItem).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(store.load(IDS)).toEqual([329, 671]);
  });

  it('writes at once on flush, and not again when the timer would have fired', () => {
    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    const store = new RrPaneSizeStore(KEY);

    store.save([1, 2], IDS);
    store.flush();
    jest.advanceTimersByTime(1000);

    expect(setItem).toHaveBeenCalledTimes(1);
  });

  it('writes nothing when there is nothing to flush', () => {
    const setItem = jest.spyOn(Storage.prototype, 'setItem');
    new RrPaneSizeStore(KEY).flush();
    expect(setItem).not.toHaveBeenCalled();
  });

  it('ignores stored data it cannot trust', () => {
    const store = new RrPaneSizeStore(KEY);
    expect(store.load(IDS)).toBeNull(); // nothing stored

    const bad = [
      '{"v":1,"weights":[1,2]}', // wrong count for three items (checked below)
      '{"v":1,"weights":[1,-2]}',
      '{"v":2,"weights":[1,2]}',
      'null',
      'not json',
    ];
    localStorage.setItem(KEY, bad[0]);
    expect(store.load(['a', 'b', 'c'])).toBeNull();
    for (const value of bad.slice(1)) {
      localStorage.setItem(KEY, value);
      expect(store.load(IDS)).toBeNull();
    }
  });

  it('restores each weight to the pane it was saved for, even if the order changed', () => {
    localStorage.setItem(KEY, '{"v":1,"weights":[300,700],"ids":["units","grid"]}');
    expect(new RrPaneSizeStore(KEY).load(['grid', 'units'])).toEqual([700, 300]);
  });

  it('falls back to the saved order when the ids do not match or are missing', () => {
    const store = new RrPaneSizeStore(KEY);

    localStorage.setItem(KEY, '{"v":1,"weights":[300,700],"ids":["x","y"]}');
    expect(store.load(IDS)).toEqual([300, 700]);

    localStorage.setItem(KEY, '{"v":1,"weights":[300,700]}');
    expect(store.load(IDS)).toEqual([300, 700]);
  });

  it('clears the stored layout and any save still waiting', () => {
    const store = new RrPaneSizeStore(KEY);
    store.save([1, 2], IDS);
    store.flush();
    store.save([3, 4], IDS);

    store.clear();
    jest.advanceTimersByTime(1000);

    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('does not throw when storage refuses to write or remove', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    const store = new RrPaneSizeStore(KEY);
    store.save([1, 2], IDS);

    expect(() => store.flush()).not.toThrow();
    expect(() => store.clear()).not.toThrow();
  });

  it('does nothing when storage is blocked', () => {
    jest.spyOn(globalThis, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    const store = new RrPaneSizeStore(KEY);
    store.save([1, 2], IDS);

    expect(store.load(IDS)).toBeNull();
    expect(() => store.flush()).not.toThrow();
    expect(() => store.clear()).not.toThrow();
  });
});
