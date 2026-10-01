import { TestBed } from '@angular/core/testing';
import type { SelectedSample } from '../../domain';
import { SampleContext } from './sample-context';

const GEARBOX_0415: SelectedSample = {
  coordinate: { componentId: 'gearbox', timestamp: '2026-10-01T04:15:00Z' },
  componentName: 'Gearbox',
  epochMs: Date.parse('2026-10-01T04:15:00Z'),
  status: 'PARTIAL',
};

describe('SampleContext', () => {
  function render(sample: SelectedSample | null) {
    const fixture = TestBed.createComponent(SampleContext);
    fixture.componentRef.setInput('sample', sample);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('says no sample is selected when there is none', () => {
    const host = render(null);
    expect(host.textContent?.trim()).toBe('No sample selected');
    expect(host.querySelector('.chip')).toBeNull();
  });

  it('names the component and the Zulu time, then a status chip', () => {
    const host = render(GEARBOX_0415);
    expect(host.querySelector('.name')?.textContent).toBe('Gearbox');
    expect(host.querySelector('.time')?.textContent).toBe('· 04:15Z');
    expect(host.querySelector('.chip')?.textContent?.trim()).toBe('Partial');
    expect(host.querySelector('.chip rr-sg-status-dot')?.getAttribute('data-status')).toBe('PARTIAL');
  });

  it('labels a future sample with the NO_DATA wording, never a verdict', () => {
    const host = render({ ...GEARBOX_0415, epochMs: Date.parse('2026-10-01T18:30:00Z'), status: 'NO_DATA' });
    expect(host.querySelector('.time')?.textContent).toBe('· 18:30Z');
    expect(host.querySelector('.chip')?.textContent?.trim()).toBe('No data yet');
  });
});
