Here is the complete implementation for a standalone Angular 22 component unit test using Vitest alongside the reactive NgRx SignalStore we generated earlier.
## 1. The Component under Test (src/app/users.component.ts)
This modern, lightweight component directly injects the UsersStore to display a reactive count and append new users via standard browser interactions.

```
import { Component, inject } from '@angular/core';import { CommonModule } from '@angular/common';import { UsersStore } from './store/users.store';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-container">
      <h2>Total Users: <span data-testid="counter">{{ store.userCount() }}</span></h2>
      <button data-testid="add-btn" (click)="store.addUser('New User')">Add User</button>
      
      @if (store.loading()) {
        <p data-testid="loading-indicator">Loading system files...</p>
      }
    </div>
  `
})export class UsersComponent {
  // Directly inject the SignalStore using modern functional dependency injection
  public readonly store = inject(UsersStore);
}

```

## 2. The Vitest Spec Execution Blueprint (src/app/users.component.spec.ts)
This test uses standard Vitest syntax (describe, it, expect). It avoids boilerplate by leveraging Angular's TestBed combined with standard DOM event dispatches inside the jsdom testing environment.

```
import { TestBed, ComponentFixture } from '@angular/core/testing';import { UsersComponent } from './users.component';import { UsersStore } from './store/users.store';

describe('UsersComponent (Angular 22 + Vitest + SignalStore)', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;
  let store: InstanceType<typeof UsersStore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersComponent],
      providers: [UsersStore] // Injects the store state instance directly into the test context
    }).compileComponents();

    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(UsersStore);
    
    fixture.detectChanges(); // Direct initial template evaluation pass
  });

  it('should initialize with a user count of 0', () => {
    const counterElement = fixture.nativeElement.querySelector('[data-testid="counter"]');
    
    expect(component).toBeTruthy();
    expect(store.userCount()).toBe(0);
    expect(counterElement?.textContent).toBe('0');
  });

  it('should reactively increment the UI counter when adding a user via the store', async () => {
    // Modify store state directly to assert reactivity
    store.addUser('Alice');
    fixture.detectChanges(); // Flush signal mutations directly down into the template view

    const counterElement = fixture.nativeElement.querySelector('[data-testid="counter"]');
    expect(counterElement?.textContent).toBe('1');
  });

  it('should trigger store updates seamlessly when the user clicks the UI button', () => {
    const addButton = fixture.nativeElement.querySelector('[data-testid="add-btn"]') as HTMLButtonElement;
    
    // Simulate real browser click event action inside JSDOM environment
    addButton.click();
    fixture.detectChanges();

    const counterElement = fixture.nativeElement.querySelector('[data-testid="counter"]');
    expect(store.users()).toContain('New User');
    expect(counterElement?.textContent).toBe('1');
  });

  it('should toggle conditional DOM sections when the loading state changes', () => {
    // Assert structural directive elements do not exist initially
    let loader = fixture.nativeElement.querySelector('[data-testid="loading-indicator"]');
    expect(loader).toBeNull();

    // Flip loading flag state
    store.setLoading(true);
    fixture.detectChanges();

    // Re-query virtual node tree structure
    loader = fixture.nativeElement.querySelector('[data-testid="loading-indicator"]');
    expect(loader).not.toBeNull();
    expect(loader?.textContent).toContain('Loading system files...');
  });
});
```

## Execution Strategy
To spin up and run this test block, execute the following script runner directly via your shell:

`npm run test`

If you are expanding this architecture, would you like me to demonstrate how to write a Vitest mock for an HTTP Service layer to feed data asynchronously into your UsersStore?

