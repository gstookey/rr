## 2. Sibling Shared Types (/common)## Shared Code Base File (/common/src/index.ts)
This defines the uniform response contracts and configurations used by both the frontend and backend.
```
export interface ClientRuntimeConfig {
  apiBaseUrl: string;
  environment: 'development' | 'staging' | 'production';
  featureFlags: {
    enableBetaFeatures: boolean;
    maintenanceMode: boolean;
  };
}
export interface GatewayApiResponse<T> {
  data: T;
  timestamp: string;
  status: number;
}
```

## Shared Library Spec File (/common/src/index.spec.ts)
A simple data verification test running directly within Node.js.

```
import { describe, it, expect } from 'vitest';import { ClientRuntimeConfig } from './index';

describe('Common Typings Validation', () => {
  it('should structuralize mock payloads correctly against contracts', () => {
    const mockConfig: ClientRuntimeConfig = {
      apiBaseUrl: 'http://localhost:3000',
      environment: 'development',
      featureFlags: { enableBetaFeatures: true, maintenanceMode: false }
    };
    
    expect(mockConfig.apiBaseUrl).toBe('http://localhost:3000');
    expect(mockConfig.featureFlags.maintenanceMode).toBeFalsy();
  });
});
```

------------------------------
## 3. Sibling Gateway Express Engine (/server)
This Express server reads configurations from a Helm Chart ConfigMap target path if deployed in a Kubernetes cluster, falling back seamlessly to a local .env profile when run locally.
## Core Server File (/server/src/index.ts)

```
import express, { Request, Response } from 'express';import * as fs from 'fs';import * as path from 'path';import { ClientRuntimeConfig, GatewayApiResponse } from '@monorepo/common';
const app = express();const PORT = process.env.PORT || 3000;
// Path mapped to Kubernetes Helm ConfigMap mount pointconst HELM_CONFIG_PATH = '/config/runtime-config.json';
export function resolveConfiguration(): ClientRuntimeConfig {
  // 1. Attempt to resolve high-priority Helm configuration variables from container filesystem
  if (fs.existsSync(HELM_CONFIG_PATH)) {
    try {
      const helmRawData = fs.readFileSync(HELM_CONFIG_PATH, 'utf-8');
      return JSON.parse(helmRawData) as ClientRuntimeConfig;
    } catch (e) {
      console.error('Failed to parse Helm ConfigMap data, falling back to process env', e);
    }
  }

  // 2. Fall back to reading localized environmental injection configurations (.env / process.env)
  return {
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    environment: (process.env.NODE_ENV as ClientRuntimeConfig['environment']) || 'development',
    featureFlags: {
      enableBetaFeatures: process.env.ENABLE_BETA_FEATURES === 'true',
      maintenanceMode: process.env.MAINTENANCE_MODE === 'true'
    }
  };
}
// REST endpoint to serve configurations downstream to the Angular app
app.get('/api/config', (req: Request, res: Response) => {
  const config = resolveConfiguration();
  const response: GatewayApiResponse<ClientRuntimeConfig> = {
    data: config,
    timestamp: new Date().toISOString(),
    status: 200
  };
  res.json(response);
});
// Avoid binding listen ports automatically during unit testing lifecyclesif (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Gateway infrastructure online: http://localhost:${PORT}`);
  });
}
export { app };
```

## Gateway API Spec File (/server/src/index.spec.ts)
This isolates and tests the configuration fallback logic without needing to launch a live network port binding loop.

```
import { describe, it, expect, beforeEach, vi } from 'vitest';import * as fs from 'fs';import { resolveConfiguration } from './index';

vi.mock('fs');

describe('Gateway Configuration Engine Router', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.API_BASE_URL;
    delete process.env.NODE_ENV;
  });

  it('should parse native environmental configurations fallback targets', () => {
    process.env.API_BASE_URL = 'http://local.gateway';
    process.env.NODE_ENV = 'development';
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);

    const targetConfig = resolveConfiguration();
    expect(targetConfig.apiBaseUrl).toBe('http://local.gateway');
    expect(targetConfig.environment).toBe('development');
  });

  it('should favor Kubernetes Helm file structure systems over environmental parameters', () => {
    const mockHelmPayload = JSON.stringify({
      apiBaseUrl: 'https://cluster.local',
      environment: 'production',
      featureFlags: { enableBetaFeatures: false, maintenanceMode: true }
    });

    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(mockHelmPayload);

    const targetConfig = resolveConfiguration();
    expect(targetConfig.apiBaseUrl).toBe('https://cluster.local');
    expect(targetConfig.environment).toBe('production');
    expect(targetConfig.featureFlags.maintenanceMode).toBe(true);
  });
});
```

------------------------------
## Execution Scripts Reference

* Run all tests inside the monorepo concurrently:

`npm run test`

* Run tests in interactive watch mode across workspaces:

`npm run test:watch`