Here are the blueprints for angular.json and the companion Vitest files required for Angular 22.
Angular 22 natively uses the high-performance Vite-backed builder ecosystem, replacing legacy Karma/Jasmine completely with the standardized unit test runner. [1] 


## 2. The Vitest Test Runner Configuration (vitest.config.ts)
Vitest intercepts code transformations globally. This file configures a jsdom simulated browser runner directly inside your Node.js engine and passes through native compiler paths. [1, 4, 5] 

```
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    globals: true, // Enables standard describe/it blocks without manual imports
    environment: 'jsdom', // Seamless browser DOM emulation layer
    setupFiles: ['src/test-setup.ts'], // Boots the Angular TestBed environment
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
});
```

## 3. Angular TestBed Target Setup (src/test-setup.ts)
This bootstrapper runs immediately before any test executing file. It handles initializing the Angular browser platform inside Vitest's virtual DOM environment. [5] 

```
import { TestBed } from '@angular/core/testing';import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';
// Explicitly boot up the standard Dynamic Testing Context
TestBed.initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);
```

## 4. Specialized Test TypeScript Mappings (tsconfig.spec.json)
Ensure you compile types properly by adding global definitions for vitest/globals. [6] 

```
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist/out-tsc/spec",
    "types": [
      "vitest/globals",
      "node"
    ]
  },
  "include": [
    "src/**/*.spec.ts",
    "src/**/*.d.ts"
  ]
}
```

Would you like me to supply a fully functional component unit test architecture example utilizing this Vitest environment alongside your newly installed NgRx SignalStore?

[1] [https://www.angulararchitects.io](https://www.angulararchitects.io/en/blog/migrate-from-karma-to-vitest/)
[2] [https://angular.dev](https://angular.dev/guide/testing/migrating-to-vitest)
[3] [https://github.com](https://github.com/Gentleman-Programming/Angular-20-Guide)
[4] [https://vitest.dev](https://vitest.dev/guide/)
[5] [https://anglebrackets-dev.medium.com](https://anglebrackets-dev.medium.com/introduction-to-vitest-and-angular-9a951aa1ec17)
[6] [https://vitest.dev](https://vitest.dev/config/globals)
