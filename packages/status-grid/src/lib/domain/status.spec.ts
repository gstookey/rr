import { COUNTED_STATUSES, STATUS_LABEL, VALIDATION_STATUSES, emptyCounts, worstOf } from './status';

describe('validation statuses', () => {
  it('has six statuses, five of which count as a verdict', () => {
    expect(VALIDATION_STATUSES).toHaveLength(6);
    expect(COUNTED_STATUSES).not.toContain('NO_DATA');
    expect(STATUS_LABEL.NO_DATA).toBe('No data yet');
  });

  it('rolls up to the worst status present — a known failure outranks an unknown one', () => {
    expect(worstOf(['VALID', 'PENDING', 'ERROR', 'PARTIAL'])).toBe('PARTIAL');
    expect(worstOf(['VALID', 'INVALID', 'ERROR'])).toBe('INVALID');
    expect(worstOf(['VALID', 'PENDING'])).toBe('PENDING');
    expect(worstOf(['VALID'])).toBe('VALID');
  });

  it('rolls up to NO_DATA when there is nothing to judge', () => {
    expect(worstOf([])).toBe('NO_DATA');
    expect(worstOf(['NO_DATA'])).toBe('NO_DATA');
  });

  it('starts every count at zero', () => {
    expect(Object.values(emptyCounts())).toEqual([0, 0, 0, 0, 0, 0]);
  });
});
