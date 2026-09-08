import { TestBed } from '@angular/core/testing';
import { RR_UI_PACKAGE } from '@rr/ui';
import { App } from './app';

describe('App (the Building shell)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });

  // Rule 9: the assertion is WHY the shell matters in S0 — the foundation
  // bootstraps zonelessly and paints its one line without a zone.js tick.
  it('bootstraps zoneless and renders the foundation headline', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const heading = (fixture.nativeElement as HTMLElement).querySelector('h1');
    expect(heading?.textContent).toContain('ACME Workshop — Foundation');
  });

  // WHY: the `@rr/*` path aliases are the seam between the shell and every
  // package it will lazy-load from S1 on. If they stop resolving through the
  // browser toolchain, every later slice fails at once and far from the cause —
  // so the foundation asserts the seam itself, not just the surface.
  it('resolves a workspace @rr/* package through the browser build', () => {
    expect(RR_UI_PACKAGE).toBe('@rr/ui');
  });
});
