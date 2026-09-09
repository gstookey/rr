import type { Marking, MarkingVocabulary } from '@rr/common';
import { markingBanner } from '@rr/common';

/**
 * Resolve a `Marking` against a SERVED vocabulary.
 *
 * The whole reason this function exists — and the reason `@rr/markings` ships no
 * level names, no compartment names and no colours — is the third outcome. A
 * marking system that renders an unknown marking as its nearest guess, or worse
 * as OPEN, has told the reader something false about data it does not
 * understand. So there are exactly three outcomes and one of them is *"I cannot
 * resolve this"* (`mac_stores_brief_v0` §6).
 *
 * Note what the banner uses and what it does not: the banner is composed from
 * the marking's canonical IDs by `markingBanner()` in the published language,
 * never from the vocabulary's human labels. `TTW` is the compartment; "Tick-Tock
 * Watchworks" is a tenant's name, and a tenant's name does not belong in a
 * banner.
 */
export interface ResolvedMarking {
  readonly resolved: true;
  /** e.g. `INTERNAL//TTW` — from `@rr/common`, never composed here. */
  readonly banner: string;
  /** A `--rr-*` custom-property NAME. The theme owns the value (AW-D22). */
  readonly colourToken: string;
  /** Human labels, for a title attribute — never for the banner string. */
  readonly description: string;
}

export interface UnresolvedMarking {
  readonly resolved: false;
  readonly label: string;
  readonly colourToken: string;
  /** The raw marking, shown as data so a reader can see what could not be read. */
  readonly raw: string;
}

export type MarkingRendering = ResolvedMarking | UnresolvedMarking;

export function resolveMarking(
  marking: Marking | undefined,
  vocabulary: MarkingVocabulary | undefined,
): MarkingRendering | undefined {
  // Nothing to render yet. `undefined` is NOT an unresolved marking: before the
  // vocabulary arrives the correct thing to paint is nothing at all, and the
  // caller reserves the space so the page does not jump when it lands.
  if (!marking || !vocabulary) {
    return undefined;
  }

  const raw = JSON.stringify(marking);
  const level = vocabulary.levels.find((entry) => entry.id === marking.level);
  const compartments = marking.compartments.map((id) => vocabulary.compartments.find((entry) => entry.id === id));

  if (!level || compartments.some((entry) => entry === undefined)) {
    return {
      resolved: false,
      label: vocabulary.unresolved.label,
      colourToken: vocabulary.unresolved.colourToken,
      raw,
    };
  }

  return {
    resolved: true,
    banner: markingBanner(marking, vocabulary.bannerSeparator),
    colourToken: level.colourToken,
    description: [level.label, ...compartments.map((entry) => entry!.label)].join(' · '),
  };
}
