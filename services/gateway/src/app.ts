import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import express, { type Express } from 'express';

/**
 * Resolve `config/manifest.json` from the PACKAGE root, which is one level above
 * both `src/` (running under tsx) and `dist/` (running the tsc build) — so the
 * same relative path is correct either way and there is no build-mode branch.
 */
const PACKAGE_ROOT = join(import.meta.dirname, '..');

export interface GatewayOptions {
  readonly manifestPath?: string;
}

export function createGatewayApp(options: GatewayOptions = {}): Express {
  const manifestPath = options.manifestPath ?? join(PACKAGE_ROOT, 'config', 'manifest.json');
  const app = express();
  app.disable('x-powered-by');

  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', service: '@rr/gateway', slice: 'S0' });
  });

  /**
   * S0: the manifest is STATIC and served verbatim. It is read per request
   * rather than cached at import so that editing the file during `npm start`
   * shows up without a restart — the caching decision belongs to S1, when the
   * manifest becomes per-group and the read stops being trivial.
   */
  app.get('/api/config', (_req, res) => {
    try {
      res.type('application/json').send(readFileSync(manifestPath, 'utf8'));
    } catch {
      // Fail loudly and typed. A gateway that silently serves `{}` when its
      // manifest is missing hands the browser an empty Building and no reason.
      res.status(500).json({ error: 'CONFIG_UNAVAILABLE', detail: 'manifest could not be read' });
    }
  });

  return app;
}
