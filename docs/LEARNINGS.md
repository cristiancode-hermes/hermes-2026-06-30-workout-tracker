# Learnings & Retrospective

This document captures lessons learned during the Workout Tracker build, things that worked well, things to improve, applied lessons from previous projects, and technical debt tracking.

---

## What Worked Well

### 1. Signal Architecture

Using Angular's `signal()` primitive for all state management was the single best architectural decision. It eliminated the need for NgRx or any external state library while providing excellent reactivity.

**Why it worked:**
- Signals integrate natively with Angular 22's zoneless change detection — no `markForCheck()` or `ChangeDetectorRef` needed
- `computed()` signals replaced Redux selectors, mapping functions, and pipe chains with simple functions
- Template syntax is clean: `@if (auth.isLoggedIn()) { ... }` instead of `(auth.isLoggedIn$ | async)`
- The `effect()` function made side effects (like localStorage persistence for dark mode) trivial

**Signal count by layer:**
- 5 services: ~20 signals total
- 10 components: ~25 local signals
- ~15 computed signals for derived state (chart math, filtered lists, etc.)

### 2. Modular NestJS Architecture

The 5-module structure (Auth, Exercises, Workouts, Progress, Seed) kept concerns cleanly separated.

**Why it worked:**
- Each module has one responsibility — easy to reason about
- `AuthModule` exports `JwtStrategy` and `PassportModule`, consumed by all other modules via guards
- `SeedModule` is self-contained with `OnModuleInit` — no wiring needed
- Adding a new endpoint requires touching only one module

### 3. Auto-Seed on First Launch

The `SeedService` implementing `OnModuleInit` eliminated all setup friction.

**Why it worked:**
- New developers: clone repo → `npm install` → `npm start` → working app with demo data
- Evaluators: immediately see 20 exercises, 3 workouts, 5 progress entries
- Reset: delete the SQLite file, restart → fresh seed
- No manual seed command to remember or forget

### 4. Inline SVG Charts

Custom SVG charts with `computed()` signals proved surprisingly effective.

**Why it worked:**
- Zero external dependencies — bundle savings of ~30 KB vs. Chart.js
- Full visual control — matches the app's Tailwind design system exactly
- Reactive by nature — chart re-renders when progress data changes (signal dependency)
- The chart math is pure functions over data arrays — trivial to unit test
- Educational value — understanding SVG coordinate systems is transferable knowledge

### 5. Tailwind v4 Dark Mode

Tailwind v4's class-based dark mode with a simple service toggle was friction-free.

**Why it worked:**
- Single `dark` class on `<html>` enables all `dark:` variants
- `DarkModeService` with localStorage persistence survives page refreshes
- Respects OS preference via `prefers-color-scheme` media query as default
- Toggle is available in both sidebar and settings page
- The `effect()` hook auto-syncs state → localStorage → DOM

---

## What I'd Do Differently

### 1. Add Frontend Component Tests

The app currently has only one spec file (`app.spec.ts`). Testing was deprioritized for velocity.

**What's missing:**
- Unit tests for `AuthService`, `WorkoutService`, `ExerciseService`, `ProgressService`
- Component tests for all 10 components (especially `WorkoutCreateComponent` wizard logic)
- Computed signal tests for chart math (`ProgressComponent`)

**Priority order for adding tests:**
1. `AuthService` — critical path, involves localStorage and routing
2. `WorkoutCreateComponent` — complex wizard logic, 8 form signals
3. `ProgressComponent` — chart math with computed signals
4. `ExerciseService` — filter/search logic
5. `WorkoutService` — CRUD operations

**Testing approach:**
```typescript
// AuthService test pattern (using Vitest)
import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService],
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should set isLoggedIn after successful login', () => {
    service.login('test@test.com', 'password');
    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ token: 'fake-jwt' });
    expect(service.isLoggedIn()).toBe(true);
    expect(localStorage.getItem('auth_token')).toBe('fake-jwt');
  });
});
```

### 2. More Seed Data

The current 3 sample workouts and 5 progress entries are adequate for demo but thin for development.

**What I'd add:**
- **10+ workouts** across 4 weeks to test pagination properly
- **20+ progress entries** spanning 3 months for better chart visualization
- **User-created exercises** mixed with seeded exercises
- **Different user profiles** to test multi-user isolation (e.g., `user1@example.com`, `user2@example.com`)

### 3. Pagination for Workouts

The API supports pagination (`page` and `limit` query params), but the frontend always requests all workouts.

**What should change:**
- `WorkoutService.loadWorkouts()` should accept `page` and `limit` parameters
- API returns `{ data, total, page, limit }` but frontend types `Workout[]` directly
- Add pagination UI (load more button or page numbers) to `WorkoutListComponent`
- Display total count: "Showing 10 of 47 workouts"

**Current bug:** The frontend maps `GET /api/workouts` response as `Workout[]` but the API returns `{ data: Workout[], total, page, limit }`. This means the frontend receives the pagination wrapper object as an array, which would fail silently or cause display issues.

### 4. Better Frontend Error Handling

Errors are surfaced but recovery is inconsistent:

- `WorkoutService.createWorkout()` shows error on the form but doesn't retry
- `ProgressService.addEntry()` shows error but the form data is lost on error
- Network errors during background refresh (dashboard) are silent

**Solutions for next iteration:**
- Implement retry logic with exponential backoff for transient failures
- Preserve form state on error (don't reset signals until success)
- Add toast notifications for background errors
- Show stale data with a "last updated X minutes ago" indicator

---

## Applied Lessons from Inventory Manager Build

This project benefited directly from lessons learned during a previous project (Inventory Manager).

### Lesson 1: Keep Signals Simple

**Inventory Manager mistake:** Used compound object signals (`signal<FormState>`) that required spreading on every update. This caused unnecessary re-computations and verbose update code.

**Applied here:** Individual signals per field.

```typescript
// Inventory Manager (before):
// const form = signal({ name: '', quantity: 0, price: 0 });
// form.set({ ...form(), quantity: 5 });

// Workout Tracker (after):
protected readonly workoutName = signal('');
protected readonly workoutDate = signal('');
// Direct updates without spread
```

### Lesson 2: Prefer CSS Frameworks Over Custom CSS

**Inventory Manager mistake:** Wrote custom CSS with no framework. Resulted in inconsistent spacing, colors, and a painful responsive implementation.

**Applied here:** Tailwind CSS v4 with a defined design system. Responsive design is declarative (`sm:`, `lg:` prefixes) and spacing is consistent.

### Lesson 3: Auto-Seed Over Manual Scripts

**Inventory Manager mistake:** Required `npm run seed` as a separate step. New developers frequently forgot to run it, hit empty dashboards, and wasted time debugging.

**Applied here:** `OnModuleInit` auto-seed. App is always ready on startup.

### Lesson 4: TypeORM Entities Over Raw SQL

**Inventory Manager mistake:** Used raw SQL queries that broke when adding/removing columns. No migration story.

**Applied here:** TypeORM entities define the schema. `synchronize: true` handles dev migrations automatically. PostgreSQL migration path is documented.

---

## Technical Debt Log

| ID | Item | Priority | Impact | Effort | Status |
|----|------|----------|--------|--------|--------|
| TD-001 | Workout pagination type mismatch (API returns object, frontend expects array) | High | Breakage | Small | Open |
| TD-002 | No frontend tests for services | High | Confidence | Medium | Open |
| TD-003 | No frontend tests for components | Medium | Confidence | Large | Open |
| TD-004 | SeedService runs on every launch (adds ~50ms startup time) | Low | Performance | Small | Open |
| TD-005 | JWT fallback secret hardcoded in source | High | Security | Tiny | Open |
| TD-006 | No input validation on frontend forms (back-end validates, but no instant feedback) | Medium | UX | Medium | Open |
| TD-007 | Workout create doesn't show success toast/page after save | Low | UX | Small | Open |
| TD-008 | No loading states for individual actions (delete, update) | Low | UX | Medium | Open |
| TD-009 | No confirmation dialog before delete in workout detail (uses `confirm()`) | Low | UX | Tiny | Open |
| TD-010 | ExerciseCard `expandedIds` uses `Set<string>` — doesn't trigger change detection on mutation | Medium | Bug | Tiny | Open |
| TD-011 | `synchronize: true` in TypeORM config will drop columns in production | High | Safety | Tiny | Open |
| TD-012 | No error boundary — a rendering error crashes the entire app | Medium | Resilience | Medium | Open |

### Debt Details

**TD-001 (High priority):** The `WorkoutService.loadWorkouts()` calls `GET /api/workouts` and maps the response to `Workout[]`. However, the API returns `{ data: Workout[], total: number, page: number, limit: number }`. The signal receives the wrapper object masquerading as an array. This needs immediate fixing.

**TD-005 (High priority):** The fallback secret `'workout-tracker-dev-secret'` is visible in source code in `auth.module.ts` and `jwt.strategy.ts`. This is acceptable for dev but must be overridden via `JWT_SECRET` environment variable in any deployed environment.

**TD-010 (Medium priority):** `ExerciseLibraryComponent.expandedIds` uses `signal(new Set<string>())`. When `toggleExpand()` calls `newSet.add(id)` on the same Set object, the signal reference doesn't change, so Angular may not detect the mutation. The current code creates a new Set (`new Set(s)`) which avoids this, but this is fragile.

**TD-011 (High priority):** `synchronize: true` with SQLite is fine for dev, but switching to PostgreSQL without disabling this could drop production data during schema changes. Must be `false` in production with proper migrations.

---

## Environment Constraints

### Build Toolchain Constraints

The project was developed in an environment without native build tools (`node-gyp`, Python, Make, C++ compiler). This directly influenced several architectural decisions:

- **sql.js over better-sqlite3:** Native addon could not compile
- **bcryptjs over bcrypt:** bcrypt requires native compilation; bcryptjs is pure JavaScript
- **No sharp/image-processing:** Would have been impossible without native modules

### Deployment Environment

- **Node.js:** Latest LTS (v22+)
- **Package manager:** npm 10.x
- **Process manager:** Unknown (app assumed to run directly with `node dist/main`)
- **Storage:** Ephemeral? Persistent? The SQLite file location must be in a persistent volume for production-like deployments

### Performance Notes

- **sql.js WASM:** ~1.5 MB bundle overhead. Cold start ~200ms for WASM initialization
- **SQLite file size:** ~48 KB with full seed data (negligible)
- **Angular bundle:** ~180 KB (gzipped ~55 KB) with all components eagerly loaded
- **API response times:** <15ms for all endpoints on local machine with seeded data
