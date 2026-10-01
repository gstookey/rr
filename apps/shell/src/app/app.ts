import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * The application root: a router outlet and nothing else.
 *
 * Every pixel of chrome belongs to a routed surface — the Building's banner and
 * identity bar to `BuildingComponent`, the signed-out card to `SignInPage`. Root
 * chrome would paint before the Building knows who is looking at it, which is
 * exactly the pre-hydration leak the mockups' fail-closed states exist to
 * prevent.
 *
 * `changeDetection: OnPush` is written explicitly even though it is the v22
 * default, so the file still says what it means after a Legacy-Island re-pin
 * to v19–v21 where the default is different (C-008, currency contract §1).
 */
@Component({
  selector: 'rr-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App {}
