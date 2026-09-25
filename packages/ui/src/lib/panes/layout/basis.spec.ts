import { DEFAULT_BASIS, parseBasis } from './basis';

describe('parseBasis', () => {
  it('reads every unit a consumer is told they may write', () => {
    expect(parseBasis(240)).toEqual({ unit: 'px', value: 240 });
    expect(parseBasis('240')).toEqual({ unit: 'px', value: 240 });
    expect(parseBasis('240px')).toEqual({ unit: 'px', value: 240 });
    expect(parseBasis('30%')).toEqual({ unit: '%', value: 30 });
    expect(parseBasis('2.5fr')).toEqual({ unit: 'fr', value: 2.5 });
    expect(parseBasis(' 1FR ')).toEqual({ unit: 'fr', value: 1 });
  });

  // WHY: a typo in a template must degrade to "shares space", never to "renders at zero".
  it('falls back to 1fr for anything it cannot trust', () => {
    for (const bad of ['', 'wide', '-10px', '10em', 'NaN', '0fr', null, undefined, -5, Infinity]) {
      expect(parseBasis(bad as never)).toEqual(DEFAULT_BASIS);
    }
  });
});
