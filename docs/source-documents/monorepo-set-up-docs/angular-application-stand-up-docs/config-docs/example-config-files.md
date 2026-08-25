## 0. package.json
```
{
  "name": "angular-22-signal-store-app",
  "version": "1.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "vitest"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "^22.0.0",
    "@angular/common": "^22.0.0",
    "@angular/compiler": "^22.0.0",
    "@angular/core": "^22.0.0",
    "@angular/forms": "^22.0.0",
    "@angular/platform-browser": "^22.0.0",
    "@angular/platform-browser-dynamic": "^22.0.0",
    "@angular/router": "^22.0.0",
    "@ngrx/operators": "^22.0.0",
    "@ngrx/signals": "^22.0.0",
    "rxjs": "^7.8.1",
    "tslib": "^2.6.2",
    "zone.js": "~0.15.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^22.0.0",
    "@angular/cli": "^22.0.0",
    "@angular/compiler-cli": "^22.0.0",
    "@types/node": "^22.0.0",
    "typescript": "~6.0.2",
    "vitest": "^2.0.0"
  },
  "engines": {
    "node": ">=22.0.0"
  }
}
```



Here is the complete set of standard configuration blueprints required to initialize a fresh, modern Angular 22 workspace built around the native Fetch API, TypeScript 6, Vitest for testing, and the modern NgRx SignalStore ecosystem. [1, 2, 3] 
## 1. Root tsconfig.json
This base configuration forces strict type-checking, supports modern class fields, and opts into the advanced optimizations required for TypeScript 6. [4] 

```
{
  "compileOnSave": false,
  "compilerOptions": {
    "outDir": "./dist/out-tsc",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "moduleResolution": "bundler",
    "importHelpers": true,
    "target": "ES2022",
    "module": "ES2022",
    "useDefineForClassFields": true,
    "isolatedModules": true
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true,
    "strictStandalone": true
  }
}
```

## 2. Application-Specific tsconfig.app.json
This targets the build configuration for your running client application. It handles src/main.ts entry points and disables explicit zone.js types if you choose to build a completely zoneless application. [5, 6] 

```
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": []
  },
  "files": [
    "src/main.ts"
  ],
  "include": [
    "src/**/*.d.ts"
  ]
}
```

## 3. Application Bootstrap Configuration (src/app/app.config.ts)
[Angular 22](https://angular.love/angular-22-key-features-and-changes) leverages standalone entry points by default. This file boots up your application, switches the standard routing layer on, and activates the global provideHttpClient using the native Fetch API engine. [1, 7, 8] 

```
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';import { provideRouter } from '@angular/router';import { provideHttpClient, withFetch } from '@angular/common/http';import { routes } from './app.routes';
export const appConfig: ApplicationConfig = {
  providers: [
    // Configure event throttling or completely remove for pure zoneless apps
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideHttpClient(withFetch()) // Explicitly enables the faster v22 Fetch-backed engine
  ]
};
```

## 4. Root Application Core Entry (src/main.ts)
This links your standalone bootstrap components together directly using the underlying platform browser APIs.

```
import { bootstrapApplication } from '@angular/platform-browser';import { AppComponent } from './app/app.component';import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
```

## 5. Production Ready NgRx SignalStore Template (src/app/store/users.store.ts)
This is a standard template for managing reactive features natively using Angular 22 signals via NgRx signalStore. Note the clean utilization of the new stable @Service() decorator. [1, 3, 9] 

```
import { computed } from '@angular/core';import { Service } from '@angular/core';import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
export interface UserState {
  users: string[];
  loading: boolean;
}
const initialState: UserState = {
  users: [],
  loading: false
};
// Declares the reactive state block using the stable Angular 22 Service wrapper
@Service()export class UsersStore extends signalStore(
  withState(initialState),
  withComputed(({ users }) => ({
    userCount: computed(() => users().length)
  })),
  withMethods((store) => ({
    addUser(user: string): void {
      patchState(store, (state) => ({ users: [...state.users, user] }));
    },
    setLoading(isLoading: boolean): void {
      patchState(store, { loading: isLoading });
    }
  }))
) {}
```

## 6. The Workspace Configuration File (angular.json)
This production-ready build-targeting matrix uses the modern application builder (@angular/build:application) for optimized production bundles and handles Vitest routing natively via the unit-test builder (@angular/build:unit-test). [2, 3] 

{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "angular-22-app": {
      "projectType": "application",
      "schematics": {
        "@angular/schematics:component": {
          "style": "css",
          "standalone": true
        }
      },
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular/build:application",
          "options": {
            "outputPath": "dist/angular-22-app",
            "index": "src/index.html",
            "browser": "src/main.ts",
            "polyFills": [],
            "tsConfig": "tsconfig.app.json",
            "assets": [
              {
                "glob": "**/*",
                "input": "public"
              }
            ],
            "styles": ["src/styles.css"],
            "scripts": []
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "500kB",
                  "maximumError": "1MB"
                }
              ],
              "outputHashing": "all"
            },
            "development": {
              "optimization": false,
              "extractLicenses": false,
              "sourceMap": true
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular/build:development-server",
          "options": {
            "buildTarget": "angular-22-app:build:development"
          },
          "configurations": {
            "production": {
              "buildTarget": "angular-22-app:build:production"
            },
            "development": {
              "buildTarget": "angular-22-app:build:development"
            }
          },
          "defaultConfiguration": "development"
        },
        "test": {
          "builder": "@angular/build:unit-test",
          "options": {
            "tsConfig": "tsconfig.spec.json"
          }
        }
      }
    }
  }
}

## Next Steps Setup Sequence
To tie these files together seamlessly in a directory structure, you can drop them into a newly created folder ecosystem.
Would you like help mapping out a customized Vitest test suite configuration next, or setting up a standard build targeting file like angular.json? [10] 

[1] [https://angular.schule](https://angular.schule/blog/2026-06-angular22/)
[2] [https://www.youtube.com](https://www.youtube.com/watch?v=NPKq68_cygY)
[3] [https://abp.io](https://abp.io/community/articles/angular-22-state-management-signals-signalstore-or-ngrx-yq8zg0nw)
[4] [https://www.linkedin.com](https://www.linkedin.com/pulse/improve-your-angular-application-performance-182-william-bastidas-p5mef)
[5] [https://angular.dev](https://angular.dev/reference/configs/file-structure)
[6] [https://medium.com](https://medium.com/@ArshdeepGrover/tsconfig-json-in-angular-every-setting-explained-776883a9b6e4)
[7] [https://www.tothenew.com](https://www.tothenew.com/blog/new-release-angular-v19-and-top-features/)
[8] [https://angular.love](https://angular.love/angular-router-everything-you-need-to-know-about)
[9] [https://angular.love](https://angular.love/angular-22-key-features-and-changes)
[10] [https://medium.com](https://medium.com/@ArshdeepGrover/angular-json-every-field-that-controls-your-angular-build-889e483c646e)
