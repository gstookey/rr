import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UrlTree, provideRouter } from '@angular/router';
import type { Me } from '@rr/common';
import { PermissionStore } from './permission-store';
import { canMatchFloor } from './floor-guards';

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

/**
 * Hydrate the store the way the browser does: create it, let the resource fire,
 * answer the one request, let the derived signals settle.
 *
 * `TestBed.tick()` rather than `ApplicationRef.whenStable()`: an in-flight
 * `httpResource` keeps the application UNSTABLE by design (it contributes to
 * stability so SSR waits for it), so awaiting stability before answering the
 * request deadlocks. `tick()` is the zoneless "run pending work now".
 */
async function hydrate(me: Me | undefined): Promise<PermissionStoreInstance> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  });
  const store = TestBed.inject(PermissionStore);
  TestBed.tick();

  const request = TestBed.inject(HttpTestingController).expectOne('/api/me');
  if (me) {
    request.flush(me);
  } else {
    // The gateway's fail-closed answer to an anonymous caller.
    request.flush({ error: 'SESSION_EXPIRED' }, { status: 401, statusText: 'Unauthorized' });
  }
  // `httpResource` delivers through the resource loader, i.e. a promise — so a
  // synchronous `flush()` is not yet a settled resource. Yield the task queue,
  // then run pending reactive work.
  await new Promise((resolve) => setTimeout(resolve, 0));
  TestBed.tick();
  return store;
}

type PermissionStoreInstance = InstanceType<typeof PermissionStore>;

/** The guard takes no parameters by design; call it as the function it is. */
const decide = (floorId: string): boolean | UrlTree =>
  TestBed.runInInjectionContext(() => (canMatchFloor(floorId) as unknown as () => boolean | UrlTree)());

describe('PermissionStore — the browser`s only view of who it is talking to', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('hydrates the subject from /api/me over the cookie, decoding nothing', async () => {
    // WHY: under the BFF there is no token in the browser to decode. If this ever
    // starts reading a JWT, the pattern has silently changed and every "no token
    // in the browser" claim in the corpus has gone stale.
    const store = await hydrate(ada);
    expect(store.isAuthenticated()).toBe(true);
    expect(store.subjectName()).toBe('Ada Vance');
    expect(store.actingAs()).toBe('Tick-Tock Watchworks');
    expect(store.clearance()).toEqual({ level: 'INTERNAL', compartments: ['TTW'] });
  });

  it('treats a 401 as signed out, not as an error to render', async () => {
    const store = await hydrate(undefined);
    // Settled AND unauthenticated — the two must be asserted together, or the
    // test would also pass while the request was still in flight.
    expect(store.isSettled()).toBe(true);
    expect(store.isAuthenticated()).toBe(false);
    expect(store.actingAs()).toBeUndefined();
    expect(store.claimedFloors().size).toBe(0);
  });
});

describe('canMatchFloor — absent, not disabled', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('matches every Floor Ada holds a claim for', async () => {
    await hydrate(ada);
    for (const floor of ['invent', 'command', 'vigilance', 'front-desk']) {
      expect(decide(floor), floor).toBe(true);
    }
  });

  it('refuses Fay`s three unheld Floors by FALLING THROUGH, not by redirecting', async () => {
    // WHY: `false` lets route matching continue to the Building's last route (the
    // Lobby). A UrlTree to a "no access" page would answer a question Fay never
    // asked and confirm that Invent exists — forbidden and non-existent must be
    // indistinguishable (`mac_stores_brief_v0` §6).
    await hydrate(fay);
    expect(decide('vigilance')).toBe(true);
    for (const floor of ['invent', 'command', 'front-desk']) {
      expect(decide(floor), floor).toBe(false);
    }
  });

  it('sends a signed-out visitor to the signed-out surface (state, not entitlement)', async () => {
    // WHY: §4.5's split. "You are not signed in" is a state with an obvious
    // remedy and deserves a destination; "this Floor is not yours" is an
    // entitlement and deserves silence.
    await hydrate(undefined);
    const outcome = decide('vigilance');
    expect(outcome).toBeInstanceOf(UrlTree);
    expect(String(outcome)).toBe('/sign-in');
  });
});
