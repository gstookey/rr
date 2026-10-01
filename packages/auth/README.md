# @rr/auth

Identity as data, under the BFF: the `/api/me` `PermissionStore`, the route gating, and the two navigations that begin and end a session. **The UI is never the enforcement point** — the gateway re-checks the same claims on every request (ASVS 5.0 §8.3.1).

**S1 status:** live.

| Export | What it is |
|---|---|
| `PermissionStore` | root `signalStore`; `httpResource<Me>('/api/me')` parsed with the published language's Zod schema. Computed slices: `isAuthenticated` · `isSettled` · `actingAs` · `subjectName` · `clearance` · `claimedFloors`. Methods: `hasFloor` · `whenSettled` · `signIn` · `signOut` |
| `canMatchFloor(id)` | **`CanMatchFn`** for ENTITLEMENT. Returns `false` so matching falls through — the route does not match, the lazy chunk is never fetched, nothing is rendered to point at |
| `canActivateSignedIn()` | **`CanActivateFn`** for STATE. Blocks and redirects to `/sign-in`, because "not signed in" has a remedy and a destination |
| `provideIdentityHydration()` | settles `/api/me` in an app initializer so guards read decided claims on a cold load |

The browser holds **no token, no identity-provider SDK and no auth state of its own**. Nothing here decodes a JWT, because there is nothing to decode.
