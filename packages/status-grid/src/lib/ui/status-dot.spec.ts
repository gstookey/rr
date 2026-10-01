import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ValidationStatus } from '../domain';
import { StatusDot } from './status-dot';

@Component({
  standalone: true,
  imports: [StatusDot],
  template: `<rr-sg-status-dot [status]="status()" />`,
})
class TestHost {
  status = signal<ValidationStatus>('VALID');
}

describe('StatusDot', () => {
  it('draws its status and stays out of the accessibility tree', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const dot: HTMLElement = fixture.nativeElement.querySelector('rr-sg-status-dot');
    expect(dot.getAttribute('data-status')).toBe('VALID');
    expect(dot.getAttribute('aria-hidden')).toBe('true');
  });

  it('follows its input', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    fixture.componentInstance.status.set('NO_DATA');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('rr-sg-status-dot').getAttribute('data-status')).toBe('NO_DATA');
  });
});
