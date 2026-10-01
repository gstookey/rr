import { InjectionToken, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { STATUS_GRID_DATA_SOURCE, provideStatusGridData, type StatusGridDataSource } from './status-grid.data-source';

const source: StatusGridDataSource = {
  units: () => [],
  unitGrid: () => null,
  sampleDetail: () => [],
};

describe('provideStatusGridData', () => {
  it('provides a data source instance', () => {
    TestBed.configureTestingModule({ providers: [provideStatusGridData(source)] });
    expect(TestBed.inject(STATUS_GRID_DATA_SOURCE)).toBe(source);
  });

  it('provides a data source from a factory run in an injection context', () => {
    const API = new InjectionToken<StatusGridDataSource>('api');
    TestBed.configureTestingModule({
      providers: [{ provide: API, useValue: source }, provideStatusGridData(() => inject(API))],
    });
    expect(TestBed.inject(STATUS_GRID_DATA_SOURCE)).toBe(source);
  });
});
