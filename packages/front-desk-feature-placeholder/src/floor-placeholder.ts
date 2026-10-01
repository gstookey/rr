import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DomainConfigStore } from '@rr/config';

/**
 * The Front Desk Floor — an empty room with its name on the door.
 *
 * S1 builds the Building, not the rooms. This component exists so that the
 * Building's claim-gated `loadChildren` boundary is proven against a REAL Floor
 * library across the Sheriff fence, rather than against a component the shell
 * happens to own. Cadence drew exactly this: a labelled dashed slot naming the
 * Floor that will mount here and the slice it arrives in.
 *
 * Note where the label comes from: the Floor knows its own **id**, and the
 * manifest knows its **name**. Nothing here hard-codes "Front Desk" as display
 * text, which is the same discipline the Lobby and the elevator keep.
 *
 * DEMOLISH THIS in S7, when the real Front Desk feature libraries arrive.
 */
@Component({
  selector: 'rr-front-desk-floor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './floor-placeholder.html',
  styleUrl: './floor-placeholder.scss',
})
export class FrontDeskFloorPlaceholder {
  /** The Floor's id — the one string this library legitimately owns. */
  static readonly floorId = 'front-desk';

  private readonly config = inject(DomainConfigStore);

  protected readonly buildingName = computed(() => this.config.buildingName() ?? '');
  protected readonly entry = computed(() =>
    this.config.floors().find((floor) => floor.id === FrontDeskFloorPlaceholder.floorId),
  );
}
