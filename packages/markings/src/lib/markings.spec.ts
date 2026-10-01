import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Marking, MarkingVocabulary } from '@rr/common';
import { RrMarkingBanner } from './banner/marking-banner';
import { RrMarkingChip } from './chip/marking-chip';

const vocabulary: MarkingVocabulary = {
  levels: [
    { id: 'OPEN', rank: 0, label: 'OPEN', colourToken: '--rr-marking-open' },
    { id: 'PARTNER', rank: 1, label: 'PARTNER', colourToken: '--rr-marking-partner' },
    { id: 'INTERNAL', rank: 2, label: 'INTERNAL', colourToken: '--rr-marking-internal' },
    { id: 'RESTRICTED', rank: 3, label: 'RESTRICTED', colourToken: '--rr-marking-restricted' },
  ],
  compartments: [
    { id: 'TTW', label: 'Tick-Tock Watchworks' },
    { id: 'MER', label: 'Meridian Wearables' },
    { id: 'TTW/NWL', label: 'Northwind Logistics' },
  ],
  bannerSeparator: '//',
  unresolved: { label: 'UNRESOLVED MARKING', colourToken: '--rr-marking-unresolved' },
};

@Component({
  selector: 'rr-banner-host',
  imports: [RrMarkingBanner],
  template: `<rr-marking-banner [marking]="marking()" [vocabulary]="vocabulary()" />`,
})
class BannerHost {
  readonly marking = signal<Marking | undefined>(undefined);
  readonly vocabulary = signal<MarkingVocabulary | undefined>(undefined);
}

describe('rr-marking-banner', () => {
  it('reserves the band and paints no marking before the vocabulary arrives', async () => {
    // WHY: fail-closed on the way IN. Nothing marking-shaped may appear until the
    // served vocabulary can account for it — and the band keeps its height so the
    // page does not jump when it does.
    const fixture = TestBed.createComponent(BannerHost);
    fixture.componentInstance.marking.set({ level: 'INTERNAL', compartments: ['TTW'] });
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('INTERNAL');
    expect(text).toContain('no marking painted yet');
  });

  it('renders the banner string and the colour SLOT the vocabulary named', async () => {
    // WHY: this is S1's "a banner renders from /api/config's vocabulary" proof at
    // the component. The component supplies neither the string nor the colour —
    // it supplies the mechanism.
    const fixture = TestBed.createComponent(BannerHost);
    fixture.componentInstance.vocabulary.set(vocabulary);
    fixture.componentInstance.marking.set({ level: 'INTERNAL', compartments: ['TTW'] });
    await fixture.whenStable();

    const banner = (fixture.nativeElement as HTMLElement).querySelector('rr-marking-banner')!;
    expect(banner.textContent).toContain('INTERNAL//TTW');
    expect((banner as HTMLElement).style.getPropertyValue('--rr-marking')).toBe('var(--rr-marking-internal)');
  });

  it('re-renders from the SAME component when the vocabulary describes a different tenant', async () => {
    // WHY: one vocabulary, two subjects (the mockup's whole point). If the banner
    // held any per-tenant state this would not work.
    const fixture = TestBed.createComponent(BannerHost);
    fixture.componentInstance.vocabulary.set(vocabulary);
    fixture.componentInstance.marking.set({ level: 'PARTNER', compartments: ['TTW/NWL'] });
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('PARTNER//TTW/NWL');
  });

  it('says UNRESOLVED MARKING and shows the raw marking as data', async () => {
    const fixture = TestBed.createComponent(BannerHost);
    fixture.componentInstance.vocabulary.set(vocabulary);
    fixture.componentInstance.marking.set({ level: 'INTERNAL', compartments: ['TTW/QRS'] });
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('UNRESOLVED MARKING');
    expect(text).toContain('TTW/QRS');
    expect(text).not.toContain('OPEN');
  });
});

@Component({
  selector: 'rr-chip-host',
  imports: [RrMarkingChip],
  template: `<rr-marking-chip [level]="'RESTRICTED'" [compartments]="compartments" [vocabulary]="vocabulary" />`,
})
class ChipHost {
  readonly compartments = ['TTW', 'TTW/NWL', 'MER'];
  readonly vocabulary = vocabulary;
}

describe('rr-marking-chip', () => {
  it('shows two compartments plus +n, with the full set in the title (AW-D21)', async () => {
    // WHY: compartment sets grow. The ruled answer is truncation with the whole
    // set available on hover — never a scrollbar in chrome, and never a chip that
    // silently drops a compartment the reader holds.
    const fixture = TestBed.createComponent(ChipHost);
    await fixture.whenStable();

    const chip = (fixture.nativeElement as HTMLElement).querySelector('rr-marking-chip')!;
    expect(chip.textContent).toContain('TTW');
    expect(chip.textContent).toContain('+1');
    expect(chip.textContent).not.toContain('MER');
    expect(chip.getAttribute('title')).toBe('RESTRICTED · TTW · TTW/NWL · MER');
  });
});
