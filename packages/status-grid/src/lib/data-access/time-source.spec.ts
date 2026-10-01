import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TIME_SOURCE_TICK_MS, TimeSource } from './time-source';

describe('TimeSource', () => {
  afterEach(() => jest.restoreAllMocks());

  // The interval is captured rather than run on fake timers, so this works under any timer mode.
  it('advances now every tick, and stops ticking when destroyed', () => {
    let tick: () => void = () => undefined;
    jest.spyOn(globalThis, 'setInterval').mockImplementation(((callback: () => void) => {
      tick = callback;
      return 42;
    }) as unknown as typeof setInterval);
    const clear = jest.spyOn(globalThis, 'clearInterval').mockImplementation(() => undefined);
    jest.spyOn(Date, 'now').mockReturnValue(1_000);

    const time = TestBed.inject(TimeSource);
    expect(time.now()).toBe(1_000);
    expect(globalThis.setInterval).toHaveBeenCalledWith(expect.any(Function), TIME_SOURCE_TICK_MS);

    jest.spyOn(Date, 'now').mockReturnValue(31_000);
    tick();
    expect(time.now()).toBe(31_000);

    TestBed.resetTestingModule();
    expect(clear).toHaveBeenCalledWith(42);
  });

  it('does not tick on the server', () => {
    const setInterval = jest.spyOn(globalThis, 'setInterval');
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    TestBed.inject(TimeSource);
    expect(setInterval).not.toHaveBeenCalledWith(expect.any(Function), TIME_SOURCE_TICK_MS);
  });
});
