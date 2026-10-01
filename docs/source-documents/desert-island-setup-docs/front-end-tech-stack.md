---
title:      Front End Tech Stack for RR Dev Environment
notes:      This is an updated proposed tech stack list (with example package.json) for the dev environment setup on the air-gapped
            development environment we are about to set up on an isolated network. This list has not been vetted for compatibility, 
            feasibility, or US-made software. This list does not match the current bundles we've produced thus far and needs to be 
            reconciled against it. It also adds new technologies, such as python.
updated:    2026-10-01
---

## Proposed Front End Tech Stack for New Desert Island

Below, I have an updated Angular 22-based tech stack that could inform the target bundle for the initial setup of the RHEL 9
workstations / development environments on the new desert island / air-gapped network for the new Project Road Runner. This also
probably has implications on the Legacy App Upgrade bundles we've worked on previously for the Legacy Island, as I'm hoping for
these tech stacks to converge. 

| Category | Technology | Version | Role |
|---|---|---|---|
| Foundational Runtimes | Node.js | 24.21.0 | Base JavaScript Runtime Engine (Active LTS) |
| Foundational Runtimes | Python Core Interpreter | 3.12.3 | Modern system scripting and automation engine (RHEL 9 AppStream) |
| Foundational Runtimes | TypeScript | 6.0.3 | Monorepo strict type compilation language baseline |
| Workstation Tooling | Visual Studio Code | 1.140.0 | Target enterprise IDE package binary for RHEL 9 deployment |
| Workstation Tooling | uv CLI Utility | 0.12.21 | High-speed offline virtual environment manager for Python scripts |
| Workstation Tooling | pnpm Store Engine | 10.15.0 | Secure package storage and deterministic lockfile symlink manager |
| IDE Extensions | Angular Language Service | 22.2.0 | VS Code extension providing real-time template type validation |
| IDE Extensions | Black Formatter | 2026.1.0 | VS Code extension automating strict PEP 8 Python alignment rules |
| Architecture / Monorepo | Nx Engine Platform | 23.1.2 | Core workspace, compilation graph, and caching manager |
| Architecture / Monorepo | @softarc/sheriff-core | 0.19.6 | Modularity engine enforcing deep file/workspace architectural rules |
| Frontend Framework | Angular Common Framework | 22.2.0 | Pinned application core, routing, and component platform |
| Design System | @astrouxds/angular | 9.0.0 | Angular standalone wrappers for space-operations visual paradigms |
| Design System | @astrouxds/astro-web-components | 9.0.0 | Core native web element definitions underlying Astro UXDS v9 |
| Design System | Tailwind CSS | 4.0.0 | Next-generation performance engine for UI design token layout styling |
| State Management | @ngrx/store | 22.0.1 | Centralized Redux immutable global store engine |
| State Management | @ngrx/effects | 22.0.1 | Isolation engine for asynchronous enterprise event side-effects |
| State Management | @ngrx/entity | 22.0.1 | High-performance state indexing adapter for collection arrays |
| State Management | @ngrx/router-store | 22.0.1 | Maps historical browser navigation directly into the Redux state tree |
| State Management | @ngrx/signals | 22.0.1 | Lightweight, functional reactive store primitive built for Angular Signals |
| Identity / Security | keycloak-js | 26.2.4 | Browser-side OIDC state driver and PKCE cryptographic coordinator |
| Identity / Security | keycloak-angular | 22.0.0 | Angular frontend HTTP request token-signing interceptor layer |
| Identity / Security | keycloak-connect | 26.7.4 | Node.js/Express server token-validation security gateway middleware |
| Backend API Engine | Express Framework | 5.0.1 | Core server API router with native async route error trapping |
| Persistence Layer | Prisma Client Core | 7.1.0 | Highly efficient generated ORM type client for PostgreSQL |
| Persistence Layer | pg (Postgres) | 8.13.1 | Low-level native database connection thread pool driver |
| Message Brokers | amqplib | 0.10.5 | RabbitMQ AMQP message queue communication client |
| Message Brokers | kafkajs | 2.2.4 | Distributed Kafka partition consumer event streaming client |
| Real-Time Streaming | @stomp/stompjs | 7.0.0 | Raw WebSocket STOMP sub-protocol packet formatting client |
| Real-Time Streaming | @stomp/rx-stomp | 2.2.0 | RxJS mapping observer wrapper layer for web stream pipelines |
| Real-Time Streaming | ws | 8.18.0 | Server-side high-performance native WebSocket connector thread |
| Real-Time Fallbacks | sockjs | 0.3.24 | Server-side fallback protocol routing channel |
| Real-Time Fallbacks | sockjs-client | 1.6.1 | Client-side browser transport fallback socket component |
| Testing Core | Jest Runner Framework | 30.5.2 | Core environment unit and spec testing engine |
| Testing Core | ts-jest | 29.4.12 | Compiles TypeScript test models cleanly inside Jest runners |
| Testing Core | Vitest Execution Core | 3.0.5 | Blazing-fast multi-threaded alternative component test simulator |
| End-to-End Automation | Cypress App Runner | 16.1.1 | Direct in-browser interaction and visual journey test system |
| End-to-End Automation | Playwright Platform | 1.50.1 | Headless engine for secure cross-browser functional testing |

------------------------------
## Example package.json
```json
{
  "name": "@rr/example",
  "version": "1.0.0",
  "private": true,
  "engines": {
    "node": "24.21.0",
    "pnpm": "10.15.0"
  },
  "packageManager": "pnpm@10.15.0",
  "scripts": {
    "preinstall": "npx only-allow pnpm",
    "build": "nx run-many -t build",
    "test": "nx run-many -t test"
  },
  "dependencies": {
    "@angular/animations": "22.2.0",
    "@angular/common": "22.2.0",
    "@angular/compiler": "22.2.0",
    "@angular/core": "22.2.0",
    "@angular/forms": "22.2.0",
    "@angular/platform-browser": "22.2.0",
    "@angular/platform-browser-dynamic": "22.2.0",
    "@angular/router": "22.2.0",
    "@angular/ssr": "22.2.0",
    "@astrouxds/angular": "9.0.0",
    "@astrouxds/astro-web-components": "9.0.0",
    "@ngrx/effects": "22.0.1",
    "@ngrx/entity": "22.0.1",
    "@ngrx/router-store": "22.0.1",
    "@ngrx/signals": "22.0.1",
    "@ngrx/store": "22.0.1",
    "@prisma/client": "7.1.0",
    "amqplib": "0.10.5",
    "compression": "1.7.4",
    "cors": "2.8.5",
    "dotenv": "16.4.5",
    "express": "5.0.1",
    "express-session": "1.18.0",
    "kafkajs": "2.2.4",
    "keycloak-angular": "22.0.0",
    "keycloak-connect": "26.7.4",
    "keycloak-js": "26.2.4",
    "lodash": "4.17.21",
    "luxon": "3.2.1",
    "pg": "8.13.1",
    "rxjs": "7.8.1",
    "sockjs": "0.3.24",
    "tslib": "2.8.1",
    "ws": "8.18.0",
    "zone.js": "0.15.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "22.2.0",
    "@angular/cdk": "22.2.0",
    "@angular/cli": "22.2.0",
    "@angular/compiler-cli": "22.2.0",
    "@angular/material": "22.2.0",
    "@babel/core": "7.24.0",
    "@babel/preset-env": "7.26.9",
    "@ngrx/operators": "22.0.1",
    "@ngrx/store-devtools": "22.0.1",
    "@nx/angular": "23.1.2",
    "@nx/express": "23.1.2",
    "@playwright/test": "1.50.1",
    "@softarc/eslint-plugin-sheriff": "0.19.6",
    "@softarc/sheriff-core": "0.19.6",
    "@stomp/rx-stomp": "2.2.0",
    "@stomp/stompjs": "7.0.0",
    "@types/amqplib": "0.10.6",
    "@types/cors": "2.8.17",
    "@types/express": "5.0.0",
    "@types/jest": "30.0.0",
    "@types/lodash": "4.17.0",
    "@types/node": "24.21.0",
    "@types/pg": "8.11.11",
    "@types/ws": "8.5.14",
    "@typescript-eslint/eslint-plugin": "7.9.0",
    "@typescript-eslint/parser": "7.9.0",
    "autoprefixer": "10.4.20",
    "babel-jest": "30.5.2",
    "cypress": "16.1.1",
    "esbuild": "0.25.0",
    "eslint": "8.56.0",
    "eslint-config-prettier": "10.1.5",
    "eslint-plugin-unused-imports": "4.1.4",
    "istanbul-lib-instrument": "6.0.3",
    "jest": "30.5.2",
    "jest-environment-jsdom": "30.5.2",
    "jest-preset-angular": "16.2.0",
    "jsdom": "26.1.0",
    "node-forge": "1.3.1",
    "nx": "23.1.2",
    "postcss": "8.5.1",
    "prettier": "3.2.5",
    "prisma": "7.1.0",
    "sockjs-client": "1.6.1",
    "tailwindcss": "4.0.0",
    "ts-jest": "29.4.12",
    "typescript": "6.0.3",
    "vite": "6.1.1",
    "vitest": "3.0.5"
  }
}
```
