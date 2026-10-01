import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ValidationStatus } from '../domain';
import { StatusDot } from './status-dot';

@Component({
  standalone: true,
  imports: [StatusDot],
  template: `<rr-sg-status-dot [status]="status()" [labelled]="labelled()" />`,
})
class TestHost {
  status = signal<ValidationStatus>('VALID');
  labelled = signal(false);
}

describe('StatusDot', () => {
  it('draws its status and stays out of the accessibility tree by default', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const dot: HTMLElement = fixture.nativeElement.querySelector('rr-sg-status-dot');
    expect(dot.getAttribute('data-status')).toBe('VALID');
    expect(dot.getAttribute('aria-hidden')).toBe('true');
    expect(dot.getAttribute('role')).toBeNull();
  });

  it('announces its own status when labelled', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.labelled.set(true);
    fixture.componentInstance.status.set('NO_DATA');
    fixture.detectChanges();
    const dot: HTMLElement = fixture.nativeElement.querySelector('rr-sg-status-dot');
    expect(dot.getAttribute('role')).toBe('img');
    expect(dot.getAttribute('aria-label')).toBe('No data yet');
    expect(dot.getAttribute('aria-hidden')).toBeNull();
  });
});
