import { InjectionToken, type Provider } from '@angular/core';

/**
 * @rr/ui panes — the single source of every number the panes need.
 *
 * Created: 2026-09-25
 *
 * WHY THIS EXISTS. v1 declared the same dimensions in several places — a rail width in the
 * component's CSS AND again in the parent's track arithmetic — and they drifted. Here each
 * number exists ONCE. The pane reads `headerSize` to size its header; the group reads the
 * pane's `collapsedSize` (derived from the same `headerSize`) to size the collapsed track.
 * They cannot disagree, because there is nothing to disagree about.
 *
 * Every value can be overridden:
 *   • app-wide, at bootstrap:         providers: [provideRrPanes({ gap: 6 })]
 *   • from runtime config (helm/env): providers: [provideRrPanes(() => inject(AppConfig).panes)]
 *   • for one subtree:                a component's own `providers: [provideRrPanes({...})]`
 *   • per instance:                   <rr-pane-group [gap]="4">, <rr-pane [min]="200">
 */
export interface RrPanesConfig {
  /** Px between items. When resizable, this is also the drag handle's track. */
  readonly gap: number;
  /** Header bar height. A block-collapsed pane is exactly this tall (plus its border). */
  readonly headerSize: number;
  /** Rail thickness of an inline-collapsed pane (plus its border). */
  readonly railSize: number;
  /** Default minimum size of an expanded pane along the group axis. */
  readonly minPaneSize: number;
  /** Whether groups are drag-resizable unless they say otherwise. */
  readonly resizable: boolean;
  /** Keyboard resize step, and the Shift+arrow step. */
  readonly keyboardStep: number;
  readonly keyboardStepLarge: number;
  /** Collapse/expand transition. 0 disables it. `prefers-reduced-motion` always wins. */
  readonly animationMs: number;
  /** localStorage key prefix for groups that set a `stateKey`. */
  readonly storagePrefix: string;
}

export const RR_PANES_DEFAULTS: RrPanesConfig = {
  gap: 8,
  headerSize: 28,
  railSize: 24,
  minPaneSize: 80,
  resizable: false,
  keyboardStep: 16,
  keyboardStepLarge: 64,
  animationMs: 160,
  storagePrefix: 'rr-panes:',
};

export const RR_PANES_CONFIG = new InjectionToken<RrPanesConfig>('RR_PANES_CONFIG', {
  providedIn: 'root',
  factory: () => RR_PANES_DEFAULTS,
});

/**
 * Override pane defaults. Accepts a partial config, or a factory that runs in an injection
 * context — which is how you feed it from runtime configuration (helm values, env, a
 * config service) without hard-coding anything:
 *
 *   provideRrPanes(() => ({ gap: inject(RuntimeConfig).panesGap }))
 *
 * Returns a plain `Provider`, not `EnvironmentProviders`, deliberately: that is what lets
 * it be used in a component's `providers` to re-theme one subtree.
 */
export function provideRrPanes(
  overrides: Partial<RrPanesConfig> | (() => Partial<RrPanesConfig>),
): Provider {
  return {
    provide: RR_PANES_CONFIG,
    useFactory: (): RrPanesConfig => ({
      ...RR_PANES_DEFAULTS,
      ...(typeof overrides === 'function' ? overrides() : overrides),
    }),
  };
}
