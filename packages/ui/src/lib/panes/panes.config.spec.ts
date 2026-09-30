import { InjectionToken, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RR_PANES_CONFIG, RR_PANES_DEFAULTS, provideRrPanes } from './panes.config';

describe('RR_PANES_CONFIG', () => {
  it('resolves to the defaults when nothing is provided', () => {
    expect(TestBed.inject(RR_PANES_CONFIG)).toEqual(RR_PANES_DEFAULTS);
  });

  it('merges a partial override over the defaults', () => {
    TestBed.configureTestingModule({ providers: [provideRrPanes({ gap: 4, headerSize: 32 })] });
    expect(TestBed.inject(RR_PANES_CONFIG)).toEqual({ ...RR_PANES_DEFAULTS, gap: 4, headerSize: 32 });
  });

  // WHY: this is how runtime configuration (helm values, env) reaches the panes without a
  // number being hard-coded — the factory runs in an injection context.
  it('runs a factory override in an injection context', () => {
    const RUNTIME = new InjectionToken<{ panesGap: number }>('runtime');
    TestBed.configureTestingModule({
      providers: [
        { provide: RUNTIME, useValue: { panesGap: 12 } },
        provideRrPanes(() => ({ gap: inject(RUNTIME).panesGap })),
      ],
    });
    expect(TestBed.inject(RR_PANES_CONFIG).gap).toBe(12);
    expect(TestBed.inject(RR_PANES_CONFIG).railSize).toBe(RR_PANES_DEFAULTS.railSize);
  });
});
