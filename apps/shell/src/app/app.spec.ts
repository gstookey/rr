import { TestBed } from '@angular/core/testing';
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
});
