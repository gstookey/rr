import { computed } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { signalStore, withComputed, withProps } from '@ngrx/signals';
import { type AppConfig, AppConfigSchema } from '@rr/common';

/**
 * `DomainConfigStore` — configuration as data (practical_picture_v0 §3).
 *
 * THE SEAM THIS STORE IS: everything that differs between two tenants arrives
 * here, from `/api/config`, at runtime. **The shell holds no Floor list, no
 * label map, no route table and no marking vocabulary** — it holds this store.
 * That is the entire mechanism behind S4's proof (a third manufacturer with zero
 * code changes), and the reason it is worth reading this file before writing any
 * `if (group === …)` anywhere in the Building.
 *
 * The response is PARSED, not cast: `httpResource`'s `parse` runs the same Zod
 * schema the gateway validated against, so a contract drift fails here, once,
 * with a field name — not later, as a blank region.
 */
export const DomainConfigStore = signalStore(
  { providedIn: 'root' },
  withProps(() => ({
    /**
     * Deliberately NOT gated on the identity store. `@rr/config` and `@rr/auth`
     * are kept independent and the shell composes them: a signed-out visitor
     * gets a 401 here that the shell never renders, because it decides "signed
     * out" from `/api/me` first. The alternative — config importing auth —
     * couples two base libraries and makes the library build order load-bearing.
     */
    config: httpResource(() => '/api/config', { parse: (raw: unknown): AppConfig => AppConfigSchema.parse(raw) }),
  })),
  withComputed(({ config }) => ({
    /** True only once a VALID manifest is in hand. Nothing tailored paints before this. */
    isReady: computed(() => config.hasValue()),
    isLoading: computed(() => config.isLoading()),
    /** The Building could not be opened. Fail closed: no cached Floors, no guesses. */
    isUnavailable: computed(() => config.error() !== undefined),

    buildingName: computed(() => (config.hasValue() ? config.value().building.name : undefined)),
    /** Served in order, rendered as served (AW-D15). No client-side sort — ever. */
    floors: computed(() => (config.hasValue() ? config.value().floors : [])),
    /** The SURFACE's marking (AW-D16), not the reader's clearance. */
    marking: computed(() => (config.hasValue() ? config.value().marking : undefined)),
    vocabulary: computed(() => (config.hasValue() ? config.value().markingVocabulary : undefined)),
    /** AW-D17 — honoured when present; the Lobby exists either way. */
    landingFloor: computed(() => (config.hasValue() ? config.value().landingFloor : undefined)),
  })),
);
