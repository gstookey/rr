import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { AppConfig } from '@rr/common';
import { DomainConfigStore } from './domain-config-store';

const vocabulary: AppConfig['markingVocabulary'] = {
  levels: [
    { id: 'OPEN', rank: 0, label: 'OPEN', colourToken: '--rr-marking-open' },
    { id: 'PARTNER', rank: 1, label: 'PARTNER', colourToken: '--rr-marking-partner' },
    { id: 'INTERNAL', rank: 2, label: 'INTERNAL', colourToken: '--rr-marking-internal' },
    { id: 'RESTRICTED', rank: 3, label: 'RESTRICTED', colourToken: '--rr-marking-restricted' },
  ],
  compartments: [{ id: 'TTW', label: 'Tick-Tock Watchworks' }],
  bannerSeparator: '//',
  unresolved: { label: 'UNRESOLVED MARKING', colourToken: '--rr-marking-unresolved' },
};

const adasBuilding: AppConfig = {
  schemaVersion: 'acme-config/1',
  building: { name: 'ACME Workshop' },
  marking: { level: 'INTERNAL', compartments: ['TTW'] },
  floors: [
    { id: 'invent', label: 'Invent', route: '/invent', blurb: 'Products.', order: 10 },
    { id: 'command', label: 'Command', route: '/command', blurb: 'Campaigns.', order: 20 },
    { id: 'vigilance', label: 'Vigilance', route: '/vigilance', blurb: 'Fleet.', order: 30 },
    { id: 'front-desk', label: 'Front Desk', route: '/front-desk', blurb: 'People.', order: 90 },
  ],
  markingVocabulary: vocabulary,
};

async function load(body: object, status = 200): Promise<InstanceType<typeof DomainConfigStore>> {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  const store = TestBed.inject(DomainConfigStore);
  TestBed.tick();
  TestBed.inject(HttpTestingController)
    .expectOne('/api/config')
    .flush(body, status === 200 ? undefined : { status, statusText: 'Server Error' });
  await new Promise((resolve) => setTimeout(resolve, 0));
  TestBed.tick();
  return store;
}

describe('DomainConfigStore — the Building, as data', () => {
  it('exposes the Floors in the order they were SERVED', async () => {
    // WHY: AW-D15 makes order manifest data. If this store ever sorted, the
    // Building would have taken back an opinion the manifest owns — and the
    // failure would be invisible until a tenant wanted a different order.
    const store = await load(adasBuilding);
    expect(store.floors().map((floor) => floor.id)).toEqual(['invent', 'command', 'vigilance', 'front-desk']);
    expect(store.buildingName()).toBe('ACME Workshop');
    expect(store.marking()).toEqual({ level: 'INTERNAL', compartments: ['TTW'] });
    expect(store.vocabulary()?.bannerSeparator).toBe('//');
  });

  it('holds no Floor list of its own when the manifest cannot be read', async () => {
    // WHY: fail closed. The shell must be able to tell "no Floors for you" from
    // "we could not find out", and a cached or defaulted list destroys that
    // distinction silently.
    const store = await load({ error: 'CONFIG_UNAVAILABLE' }, 500);
    expect(store.isUnavailable()).toBe(true);
    expect(store.isReady()).toBe(false);
    expect(store.floors()).toEqual([]);
    expect(store.vocabulary()).toBeUndefined();
    expect(store.marking()).toBeUndefined();
  });

  it('rejects a manifest that does not match the published language', async () => {
    // WHY: `parse` runs the same Zod schema the gateway validated against, so a
    // contract drift fails HERE, once, instead of as a blank region three
    // components away.
    const store = await load({ ...adasBuilding, floors: [{ id: 'invent' }] });
    expect(store.isUnavailable()).toBe(true);
    expect(store.floors()).toEqual([]);
  });
});
