import type { MarkingVocabulary } from '@rr/common';
import { resolveMarking } from './resolve-marking';

const vocabulary: MarkingVocabulary = {
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

describe('resolving a marking against a SERVED vocabulary', () => {
  it('paints nothing at all before the vocabulary arrives', () => {
    // WHY: "nothing yet" and "cannot resolve" are different facts. A banner that
    // guesses and corrects itself a beat later has shown a marking that was not
    // true; the caller reserves the space instead.
    expect(resolveMarking({ level: 'INTERNAL', compartments: ['TTW'] }, undefined)).toBeUndefined();
    expect(resolveMarking(undefined, vocabulary)).toBeUndefined();
  });

  it('builds the banner from canonical ids and the vocabulary`s separator', () => {
    const rendering = resolveMarking({ level: 'INTERNAL', compartments: ['TTW'] }, vocabulary);
    expect(rendering).toEqual({
      resolved: true,
      banner: 'INTERNAL//TTW',
      colourToken: '--rr-marking-internal',
      description: 'INTERNAL · Tick-Tock Watchworks',
    });
  });

  it('never lets a tenant`s NAME into the banner string', () => {
    // WHY: the vocabulary carries human labels ("Tick-Tock Watchworks") for the
    // benefit of a title attribute. A banner is a canonical string; putting a
    // customer's trading name in it would be a tenancy leak in 11px type.
    const rendering = resolveMarking({ level: 'PARTNER', compartments: ['TTW/NWL'] }, vocabulary);
    expect(rendering).toMatchObject({ resolved: true, banner: 'PARTNER//TTW/NWL' });
    expect((rendering as { banner: string }).banner).not.toContain('Northwind');
  });

  it('renders an explicit UNRESOLVED state — never a guess and never OPEN', () => {
    // WHY: this is the reason the package ships no vocabulary. A compartment the
    // served vocabulary does not know is data this deployment cannot describe,
    // and describing it anyway is how a marking system lies.
    const rendering = resolveMarking({ level: 'INTERNAL', compartments: ['TTW/QRS'] }, vocabulary);
    expect(rendering).toEqual({
      resolved: false,
      label: 'UNRESOLVED MARKING',
      colourToken: '--rr-marking-unresolved',
      raw: '{"level":"INTERNAL","compartments":["TTW/QRS"]}',
    });
    expect(JSON.stringify(rendering)).not.toContain('OPEN');
  });

  it('ships no level names, compartment names or colours of its own', () => {
    // WHY: the package's whole contract, asserted against its own source: with an
    // EMPTY vocabulary nothing resolves, because there is nothing compiled in to
    // fall back on.
    const empty: MarkingVocabulary = {
      levels: [],
      compartments: [],
      bannerSeparator: '::',
      unresolved: { label: 'X', colourToken: '--rr-x' },
    };
    expect(resolveMarking({ level: 'INTERNAL', compartments: [] }, empty)).toMatchObject({ resolved: false });
  });
});
