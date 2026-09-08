import { describe, expect, it } from 'vitest';
import { MarkingSchema, dominates, markingBanner } from './marking.js';
import type { Marking, SubjectClearance } from './marking.js';

describe('Marking — the published language\'s one real schema in S0', () => {
  it('rejects a marking that is not in ACME\'s fictional vocabulary', () => {
    // WHY: the vocabulary is the whole point of the compartment model. A row
    // whose level is outside it must fail loudly at the boundary, not render as
    // an unmarked row — an unmarked row is the failure that leaks data.
    expect(MarkingSchema.safeParse({ level: 'SECRET', compartments: [] }).success).toBe(false);
    expect(MarkingSchema.safeParse({ level: 'INTERNAL', compartments: ['ttw'] }).success).toBe(false);
    expect(MarkingSchema.safeParse({ level: 'INTERNAL', compartments: ['TTW/NWL'] }).success).toBe(true);
  });

  it('refuses unknown keys, so a marking cannot smuggle an extra axis', () => {
    const parsed = MarkingSchema.safeParse({ level: 'OPEN', compartments: [], caveat: 'NOFORN' });
    expect(parsed.success).toBe(false);
  });

  it('applies the R5 dominance rule on both axes, not just the level', () => {
    // WHY (slice S2's proof, in miniature): Ada of TTW and Dee of MER must see
    // disjoint rows from one endpoint. Level alone would show Dee everything.
    const ada: SubjectClearance = { level: 'INTERNAL', compartments: ['TTW', 'TTW/NWL'] };
    const dee: SubjectClearance = { level: 'RESTRICTED', compartments: ['MER'] };
    const ttwRow: Marking = { level: 'INTERNAL', compartments: ['TTW'] };

    expect(dominates(ada, ttwRow)).toBe(true);
    // Dee out-ranks the row on level and STILL may not see it — need-to-know.
    expect(dominates(dee, ttwRow)).toBe(false);
    // Ada may not see a row above her level even inside her own compartment.
    expect(dominates(ada, { level: 'RESTRICTED', compartments: ['TTW'] })).toBe(false);
  });

  it('renders a stable banner regardless of compartment order', () => {
    expect(markingBanner({ level: 'OPEN', compartments: [] })).toBe('OPEN');
    expect(markingBanner({ level: 'INTERNAL', compartments: ['TTW/NWL', 'TTW'] })).toBe(
      'INTERNAL//TTW, TTW/NWL',
    );
  });
});
