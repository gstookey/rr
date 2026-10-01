import { Router } from 'express';
import type { ApiError } from '@rr/common';
import { type ManifestFile, configForGroup } from '../config/manifest.js';

/**
 * The two READS the Building hydrates from (AW-D18). Both are fail-closed and
 * both re-check the session on every request — the browser's guards and nav
 * items are UX, and this is the layer that actually decides (ASVS 5.0 §8.3.1).
 */

export interface ApiRoutesOptions {
  /** Re-read per request in S1 so editing the manifest during `npm start` shows up. */
  readonly manifest: () => ManifestFile;
}

const unauthenticated: ApiError = { error: 'SESSION_EXPIRED' };

export function createApiRoutes(options: ApiRoutesOptions): Router {
  const router = Router();

  /**
   * `GET /api/me` — the resolved subject, or 401. There is deliberately no third
   * outcome: a partial subject (a name with no group, a group with no clearance)
   * would render a Building whose chrome describes a person who does not exist.
   */
  router.get('/api/me', (req, res) => {
    const subject = req.session.subject;
    if (!subject) {
      res.status(401).json(unauthenticated);
      return;
    }
    // `subject` is exactly the parsed `Me` — the tokens sitting beside it in the
    // session are not reachable from here by construction, not by discipline.
    res.json(subject);
  });

  /**
   * `GET /api/config` — this subject's Building: manifest, marking, vocabulary.
   *
   * When it cannot be assembled the answer is a typed 500 and NOTHING else. The
   * failure mode being avoided is a gateway that serves `{ floors: [] }`, which
   * the Lobby cannot distinguish from a tenant who legitimately has no Floors.
   */
  router.get('/api/config', (req, res) => {
    const subject = req.session.subject;
    if (!subject) {
      res.status(401).json(unauthenticated);
      return;
    }
    try {
      const config = configForGroup(options.manifest(), subject.group.path);
      if (!config) {
        const error: ApiError = { error: 'CONFIG_UNAVAILABLE', detail: 'no manifest for the session group' };
        res.status(500).json(error);
        return;
      }
      res.json(config);
    } catch {
      const error: ApiError = { error: 'CONFIG_UNAVAILABLE', detail: 'manifest could not be read or validated' };
      res.status(500).json(error);
    }
  });

  return router;
}
