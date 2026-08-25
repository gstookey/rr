Here is the complete implementation for the Express gateway configuration engine, the shared types layer, and a standardized Vitest workspace configuration that enables fast unit testing across all three projects simultaneously.
## 1. Unified Monorepo Vitest Test Suite Setup
To run tests across /client, /common, and /server from a single root command, you can use a unified Vitest workspace architecture.
## Root /vitest.workspace.ts
Create this file in your root folder to define individual project configurations and execution environments.

```
import { defineWorkspace } from 'vitest/config';
export default defineWorkspace([
  {
    extends: 'client/vitest.config.ts',
    test: {
      name: 'client-unit-tests',
      environment: 'jsdom',
    }
  },
  {
    test: {
      name: 'common-lib-tests',
      environment: 'node',
      include: ['common/src/**/*.spec.ts'],
    }
  },
  {
    test: {
      name: 'server-api-tests',
      environment: 'node',
      include: ['server/src/**/*.spec.ts'],
    }
  }
]);
```

## Updated Root /package.json
Add vitest to your root dependencies and adjust your root testing scripts.

```
{
  "name": "my-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "common",
    "client",
    "server"
  ],
  "scripts": {
    "build:common": "npm run build --workspace=common",
    "build:client": "npm run build --workspace=client",
    "build:server": "npm run build --workspace=server",
    "build": "npm run build:common && npm run build:client && npm run build:server",
    "test": "vitest run",
    "test:watch": "vitest",
    "start": "npm run start --workspace=server",
    "serve": "npm run start --workspace=client"
  },
  "devDependencies": {
    "vitest": "^2.0.0"
  }
}
```

------------------------------
