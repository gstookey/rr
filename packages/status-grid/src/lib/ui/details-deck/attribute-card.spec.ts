import { TestBed } from '@angular/core/testing';
import type { ElementAttribute } from '../../domain';
import { AttributeCard } from './attribute-card';

const OFFSET: ElementAttribute = {
  id: 'gearbox:vibration-sensor-a:calibration-offset',
  name: 'Calibration Offset',
  expected: '0.130',
  actual: '0.130',
  match: 'MATCH',
};

describe('AttributeCard', () => {
  function render(attribute: ElementAttribute) {
    const fixture = TestBed.createComponent(AttributeCard);
    fixture.componentRef.setInput('attribute', attribute);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    return {
      host,
      flag: () => host.querySelector('.flag')?.textContent ?? null,
      values: () => Array.from(host.querySelectorAll('dd')).map((dd) => dd.textContent?.trim()),
    };
  }

  it('is a list item that names its match state', () => {
    const { host } = render(OFFSET);
    expect(host.getAttribute('role')).toBe('listitem');
    expect(host.getAttribute('data-match')).toBe('MATCH');
  });

  it('shows a match quietly: name, both values, no flag', () => {
    const { host, flag, values } = render(OFFSET);
    expect(host.querySelector('.name')?.textContent).toBe('Calibration Offset');
    expect(flag()).toBeNull();
    expect(values()).toEqual(['0.130', '0.130']);
  });

  it('flags a mismatch in text, with the arrow hidden from screen readers', () => {
    const { host, flag, values } = render({ ...OFFSET, actual: '0.250', match: 'MISMATCH' });
    expect(host.getAttribute('data-match')).toBe('MISMATCH');
    expect(flag()).toBe('◄ mismatch');
    expect(host.querySelector('.flag [aria-hidden="true"]')?.textContent).toBe('◄ ');
    expect(values()).toEqual(['0.130', '0.250']);
  });

  it('shows a missing value as "value not received"', () => {
    const { host, flag, values } = render({ ...OFFSET, actual: null, match: 'MISSING' });
    expect(host.getAttribute('data-match')).toBe('MISSING');
    expect(flag()).toBe('missing');
    expect(values()).toEqual(['0.130', 'value not received']);
    expect(host.querySelector('.value--missing')).not.toBeNull();
  });

  it('trusts match, never a comparison of the strings', () => {
    // Different spellings of one number, judged MATCH by the source: no flag.
    expect(render({ ...OFFSET, actual: '0.13' }).flag()).toBeNull();
    // Identical strings, judged MISMATCH by the source: flagged.
    expect(render({ ...OFFSET, match: 'MISMATCH' }).flag()).toBe('◄ mismatch');
    // A value present but judged MISSING: still reads as not received.
    expect(render({ ...OFFSET, match: 'MISSING' }).values()).toEqual(['0.130', 'value not received']);
  });
});
