import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { PermissionStore } from '@rr/auth';
import type { AppConfig, Me } from '@rr/common';
import { DomainConfigStore } from '@rr/config';
import { routes } from './app.routes';

/**
 * S1's PROOF, in the browser.
 *
 * The gateway specs prove that Ada and Fay are SERVED different Buildings. These
 * prove the other half: that the same compiled application renders those two
 * Buildings, and that Fay's three unheld Floors are **absent** — no disabled
 * row, no padlock, no "request access", nothing in the DOM to point at.
 */

const vocabulary: AppConfig['markingVocabulary'] = {
  levels: [
    { id: 'OPEN', rank: 0, label: 'OPEN', colourToken: '--rr-marking-open' },
    { id: 'PARTNER', rank: 1, label: 'PARTNER', colourToken: '--rr-marking-partner' },
    { id: 'INTERNAL', rank: 2, label: 'INTERNAL', colourToken: '--rr-marking-internal' },
    { id: 'RESTRICTED', rank: 3, label: 'RESTRICTED', colourToken: '--rr-marking-restricted' },
  ],
  compartments: [
    { id: 'TTW', label: 'Tick-Tock Watchworks' },
    { id: 'TTW/NWL', label: 'Northwind Logistics' },
  ],
  bannerSeparator: '//',
  unresolved: { label: 'UNRESOLVED MARKING', colourToken: '--rr-marking-unresolved' },
};

const ada: Me = {
  sub: 'mock|ada',
  username: 'ada',
  displayName: 'Ada Vance',
  group: { path: '/ttw', displayName: 'Tick-Tock Watchworks' },
  handlingLevel: 'INTERNAL',
  compartments: ['TTW'],
  roles: [],
  floors: ['invent', 'command', 'vigilance', 'front-desk'],
};

const adasBuilding: AppConfig = {
  schemaVersion: 'acme-config/1',
  building: { name: 'ACME Workshop' },
  marking: { level: 'INTERNAL', compartments: ['TTW'] },
  floors: [
    { id: 'invent', label: 'Invent', route: '/invent', blurb: 'Products, specs and the device registry.', order: 10, arrivesIn: 'S2' },
    { id: 'command', label: 'Command', route: '/command', blurb: 'Campaigns, distribution vectors, entitlements.', order: 20, arrivesIn: 'S6' },
    { id: 'vigilance', label: 'Vigilance', route: '/vigilance', blurb: 'Fleet, positions, health, offline devices.', order: 30, arrivesIn: 'S3' },
    { id: 'front-desk', label: 'Front Desk', route: '/front-desk', blurb: 'People and groups; manage my group.', order: 90, arrivesIn: 'S7' },
  ],
  markingVocabulary: vocabulary,
};

// NON-VACUITY, PINNED. `fay` (the CLAIM she holds) and `faysBuilding` (the
// MANIFEST she is served) are two independent inputs, and the S1 proof depends
// on them staying independent: the manifest decides what the Lobby lists, the
// claim decides what the router will match. Editing them in lockstep would
// silently collapse two mechanisms into one and the absence tests below would
// keep passing while proving half as much. Verified 2026-09-08 by granting fay
// the `invent` claim alone: exactly one spec turned red — the route-guard one.
const fay: Me = {
  sub: 'mock|fay',
  username: 'fay',
  displayName: 'Fay Oyelaran',
  group: { path: '/ttw/nwl', displayName: 'Northwind Logistics' },
  handlingLevel: 'PARTNER',
  compartments: ['TTW/NWL'],
  roles: [],
  floors: ['vigilance'],
};

const faysBuilding: AppConfig = {
  schemaVersion: 'acme-config/1',
  building: { name: 'ACME Workshop' },
  marking: { level: 'PARTNER', compartments: ['TTW/NWL'] },
  floors: [
    { id: 'vigilance', label: 'Vigilance', route: '/vigilance', blurb: 'Fleet, positions, health, offline devices.', order: 30, arrivesIn: 'S3' },
  ],
  landingFloor: 'vigilance',
  markingVocabulary: vocabulary,
};

const settle = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  TestBed.tick();
};

/**
 * Boot the Building the way it boots for real: hydrate `/api/me` and
 * `/api/config` FIRST, then navigate — which is what `provideIdentityHydration()`
 * guarantees in the application and what the guards depend on.
 */
async function enter(
  url: string,
  me: Me | undefined,
  config: AppConfig | undefined,
): Promise<RouterTestingHarness> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter(routes, withComponentInputBinding()),
      provideLocationMocks(),
    ],
  });

  TestBed.inject(PermissionStore);
  TestBed.inject(DomainConfigStore);
  TestBed.tick();

  const http = TestBed.inject(HttpTestingController);
  const unauthorized = { error: 'SESSION_EXPIRED' };
  const meRequest = http.expectOne('/api/me');
  if (me) {
    meRequest.flush(me);
  } else {
    meRequest.flush(unauthorized, { status: 401, statusText: 'Unauthorized' });
  }

  const configRequest = http.expectOne('/api/config');
  if (config) {
    configRequest.flush(config);
  } else {
    configRequest.flush({ error: 'CONFIG_UNAVAILABLE' }, { status: 500, statusText: 'Server Error' });
  }

  await settle();
  const harness = await RouterTestingHarness.create(url);
  await settle();
  return harness;
}

const text = (harness: RouterTestingHarness): string =>
  (harness.fixture.nativeElement as HTMLElement).textContent ?? '';

describe('The Lobby renders the manifest, and only the manifest', () => {
  it('shows Ada four Floors, in the served order, with the labels and blurbs the manifest gave', async () => {
    // WHY: not one of these strings exists in the application's source. If this
    // test can be made to pass by editing a component, the Building has taken
    // back a Floor list and S4's proof is already dead.
    const harness = await enter('/', ada, adasBuilding);

    const cards = (harness.fixture.nativeElement as HTMLElement).querySelectorAll('.rr-floor-card__name');
    expect([...cards].map((card) => card.textContent?.trim())).toEqual([
      'Invent',
      'Command',
      'Vigilance',
      'Front Desk',
    ]);
    expect(text(harness)).toContain('4 Floors are open to Tick-Tock Watchworks.');
    expect(text(harness)).toContain('Products, specs and the device registry.');
  });

  it('shows Fay one Floor — and the same component renders it', async () => {
    const harness = await enter('/', fay, faysBuilding);
    const cards = (harness.fixture.nativeElement as HTMLElement).querySelectorAll('.rr-floor-card__name');
    expect([...cards].map((card) => card.textContent?.trim())).toEqual(['Vigilance']);
    expect(text(harness)).toContain('One Floor is open to Northwind Logistics.');
  });

  it('renders NOTHING about Invent, Command or Front Desk anywhere in Fay`s Building', async () => {
    // WHY: this is the S1 deliverable, asserted as ABSENCE. Not "disabled", not
    // "hidden": absent. A `[disabled]` affordance would pass a naive "Fay cannot
    // click Invent" test and still tell her Invent exists.
    const harness = await enter('/', fay, faysBuilding);
    const html = (harness.fixture.nativeElement as HTMLElement).innerHTML;
    for (const absent of ['Invent', 'Command', 'Front Desk', '/invent', '/command', '/front-desk']) {
      expect(html, `Fay's Building must not contain ${absent}`).not.toContain(absent);
    }
    expect(html).not.toContain('disabled');
  });
});

describe('An unheld Floor is absent — the route does not match', () => {
  it('mounts the Invent placeholder for Ada, who holds the claim', async () => {
    const harness = await enter('/invent', ada, adasBuilding);
    expect(text(harness)).toContain('Invent Floor mounts here');
    // The elevator rail appears on a Floor and not in the Lobby (AW-D23).
    expect((harness.fixture.nativeElement as HTMLElement).querySelector('.rr-elevator')).not.toBeNull();
  });

  it('answers Fay`s /invent with the Lobby, and tells her nothing', async () => {
    // WHY: `canMatchFloor` returns false, matching falls through to the
    // Building's wildcard, and Fay lands in the Lobby. Forbidden and
    // non-existent are indistinguishable — there is no "no access" page to
    // confirm that Invent is a real place (`mac_stores_brief_v0` §6).
    const harness = await enter('/invent', fay, faysBuilding);
    expect(text(harness)).not.toContain('Invent Floor mounts here');
    expect(text(harness)).toContain('One Floor is open to Northwind Logistics.');
    expect((harness.fixture.nativeElement as HTMLElement).innerHTML).not.toContain('Invent');
  });

  it('keeps the Lobby for a single-Floor tenant instead of jumping into the Floor', async () => {
    // WHY: AW-D17. Fay needs somewhere to stand when Vigilance fails to load and
    // somewhere to sign out from. `landingFloor` is a convenience, never a
    // replacement for the front door.
    const harness = await enter('/', fay, faysBuilding);
    expect(text(harness)).toContain('One Floor is open to');
    expect(text(harness)).not.toContain('Vigilance Floor mounts here');
  });
});

describe('The banner is built from the served vocabulary', () => {
  it('renders Ada`s marking string and the colour SLOT the vocabulary named', async () => {
    // WHY: "a banner renders from /api/config's vocabulary" is an S1 acceptance
    // criterion. The string and the colour both come from the response; the
    // application supplies only the mechanism.
    const harness = await enter('/', ada, adasBuilding);
    const banners = (harness.fixture.nativeElement as HTMLElement).querySelectorAll('rr-marking-banner');

    expect(banners.length, 'banner top AND bottom').toBe(2);
    for (const banner of banners) {
      expect(banner.textContent).toContain('INTERNAL//TTW');
      expect((banner as HTMLElement).style.getPropertyValue('--rr-marking')).toBe('var(--rr-marking-internal)');
    }
  });

  it('renders Fay`s different marking from the SAME vocabulary', async () => {
    const harness = await enter('/', fay, faysBuilding);
    const banner = (harness.fixture.nativeElement as HTMLElement).querySelector('rr-marking-banner')!;
    expect(banner.textContent).toContain('PARTNER//TTW/NWL');
    expect((banner as HTMLElement).style.getPropertyValue('--rr-marking')).toBe('var(--rr-marking-partner)');
  });

  it('shows the reader`s clearance as a chip, distinct from the surface`s banner', async () => {
    // WHY: the banner describes the DATA; the chip describes the READER. Drawing
    // them the same way is how someone comes to believe their clearance is a
    // property of the screen.
    const harness = await enter('/', ada, adasBuilding);
    const chip = (harness.fixture.nativeElement as HTMLElement).querySelector('rr-marking-chip')!;
    expect(chip.textContent).toContain('INTERNAL');
    expect(chip.textContent).toContain('TTW');
    expect(chip.getAttribute('title')).toBe('INTERNAL · TTW');
  });
});

describe('Fail closed', () => {
  it('says CONFIG_UNAVAILABLE and draws no elevator and no Floor list', async () => {
    // WHY: the mockup's state. A cached or defaulted Floor list here would make
    // "we could not find out" look exactly like "here is your Building".
    const harness = await enter('/', ada, undefined);
    expect(text(harness)).toContain('The Building cannot be opened');
    expect(text(harness)).toContain('CONFIG_UNAVAILABLE');
    expect((harness.fixture.nativeElement as HTMLElement).querySelector('.rr-elevator')).toBeNull();
    expect((harness.fixture.nativeElement as HTMLElement).querySelector('.rr-floor-card')).toBeNull();
  });

  it('sends a signed-out visitor to the signed-out surface, which has no credential form', async () => {
    // WHY: the absence of a password field IS the seam. If an input ever appears
    // on this page, the BFF pattern has been abandoned and the token is next.
    const harness = await enter('/', undefined, undefined);
    const root = harness.fixture.nativeElement as HTMLElement;

    expect(text(harness)).toContain('You are signed out');
    expect(root.querySelectorAll('input').length, 'no credential form').toBe(0);
    expect(root.querySelector('form')).toBeNull();
    expect(root.querySelector('a.rr-btn')?.getAttribute('href')).toContain('/auth/login');
    // No marking banner: nothing to mark, and no vocabulary for an anonymous caller.
    expect(root.querySelector('rr-marking-banner')).toBeNull();
  });

  it('never renders a token, and never renders an unknown error code', async () => {
    // WHY: the browser holds nothing but a cookie it cannot read. This asserts
    // the negative on the surface a reader actually sees.
    const harness = await enter('/', ada, adasBuilding);
    const html = (harness.fixture.nativeElement as HTMLElement).innerHTML;
    expect(html).not.toMatch(/eyJ[A-Za-z0-9_-]+\./);
    for (const field of ['access_token', 'id_token', 'refresh_token', 'Bearer']) {
      expect(html).not.toContain(field);
    }
  });
});
