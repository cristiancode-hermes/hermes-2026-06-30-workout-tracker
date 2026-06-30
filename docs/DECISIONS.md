# Architectural Decision Records

This document captures key architectural decisions made during the development of the Workout Tracker application. Each entry follows the ADR (Architecture Decision Record) format: Context → Decision → Consequences.

---

## ADR-001: Use sql.js Instead of better-sqlite3

### Context

The application needed a local SQL database for development and testing. The two primary SQLite options in the Node.js ecosystem are `better-sqlite3` (native C++ addon) and `sql.js` (JavaScript compiled from C via Emscripten, running as WebAssembly).

Initially, `better-sqlite3` was the first choice due to its better performance and synchronous API. However, the deployment environment lacked native build tools — no `node-gyp` / `python` / `make` — making it impossible to compile the native addon.

### Decision

Use `sql.js` via TypeORM's built-in `sqljs` driver.

```typescript
TypeOrmModule.forRoot({
  type: 'sqljs',           // instead of 'sqlite' / 'better-sqlite3'
  location: 'data/workout-tracker.sqlite',
  autoSave: true,
  synchronize: true,
  entities: [/* ... */],
})
```

### Consequences

**Positive:**
- Zero native dependencies — no build tools required
- Works immediately in any Node.js environment
- Entire database is a single file, trivially resettable by deleting it
- TypeORM abstracts the driver, so switching to PostgreSQL later requires only config change
- `autoSave: true` persists changes to disk synchronously

**Negative:**
- ~5% slower than better-sqlite3 for bulk operations
- 1.5 MB larger package size due to bundled WASM binary
- `synchronize: true` is dangerous in production (auto-drops columns)

**Mitigation:**
- For production, migrate to PostgreSQL (documented in DATABASE.md)
- `synchronize: true` is acceptable for dev only; production will use proper migrations

---

## ADR-002: Use Angular Signals Instead of NgRx

### Context

The application needed state management for auth status, workout list, exercise catalog, and progress entries. Angular 22 provides Signals as a first-class reactivity primitive. The alternative was NgRx (Redux-style store).

### Decision

Use Angular's built-in `signal()` function for all state management, with services acting as lightweight stores.

```typescript
// Each service exposes signals for state
readonly workouts = signal<Workout[]>([]);
readonly isLoading = signal(false);
readonly error = signal<string | null>(null);
```

### Consequences

**Positive:**
- Zero extra dependencies — no `@ngrx/store`, `@ngrx/effects`, `@ngrx/entity`
- Simpler mental model — signals are just reactive values, not reducers/actions/effects
- Excellent integration with Angular 22's zoneless change detection
- Computed signals (`computed()`) replace Redux selectors without the ceremony
- Signals are tree-shakeable and lightweight
- Changes are automatically tracked in templates with `@if` / `@for` control flow

**Negative:**
- No built-in devtools timeline (like Redux DevTools)
- No middleware for side effects — HTTP calls are managed manually via `subscribe()`
- Cross-component communication is ad-hoc (services + signals) vs. centralized store
- Less testable in isolation (no pure reducer functions)

**Why Not NgRx:**
- The app is small — 5 entities, 4 services, ~10 components
- NgRx would triple the boilerplate for no tangible benefit
- Future state (SSR, larger app) could adopt signals-based store like `ngrx/signals`

---

## ADR-003: Use Standalone Components Instead of NgModules

### Context

Angular 22 fully embraces standalone components (Components, Directives, Pipes without NgModules). The alternative was traditional NgModule-based architecture.

### Decision

Use standalone components exclusively. No `NgModule` decorators exist in the application except for the NestJS backend modules.

```typescript
@Component({
  selector: 'app-dashboard',
  standalone: true,           // no NgModule needed
  imports: [RouterLink, DatePipe, LoadingSpinnerComponent],
  template: `...`,
})
export class DashboardComponent { ... }
```

The root app bootstraps directly:

```typescript
// main.ts — no AppModule
bootstrapApplication(App, appConfig)
```

### Consequences

**Positive:**
- Reduced boilerplate — no `declarations`, `exports`, or module imports for each component
- Better lazy loading — each component is independently loadable
- Smaller bundle — tree-shaking works at component level
- Easier to test — components don't depend on module structure
- Future-proof — Angular's direction is standalone-only

**Negative:**
- Each component must explicitly import its dependencies
- Shared components must be listed in every consumer's `imports` array
- Some Angular libraries still expect NgModule wrappers

---

## ADR-004: Use JWT Auth Over Session-Based Auth

### Context

The application needed user authentication. Options: JWT (stateless tokens) or session-based (server-side sessions with cookies).

### Decision

Use JWT authentication with `@nestjs/jwt` and `@nestjs/passport` (passport-jwt strategy).

**Token details:**
- Algorithm: HS256 (HMAC with SHA-256)
- Payload: `{ sub: user.id, email: user.email }`
- Expiration: 7 days
- Secret: Environment variable `JWT_SECRET` or fallback `'workout-tracker-dev-secret'`

**Flow:**
1. User logs in → server returns `{ token: "eyJ..." }`
2. Frontend stores token in `localStorage`
3. Every API call includes `Authorization: Bearer <token... Strategy validates token and attaches user to `req.user`

### Consequences

**Positive:**
- No session storage needed — completely stateless
- Scales horizontally without shared session store (Redis, etc.)
- Token can be used from any client (SPA, mobile, API consumers)
- 7-day expiration provides good UX (no frequent re-login)
- Passport strategy provides clean integration with NestJS guards

**Negative:**
- Token is stored in localStorage — vulnerable to XSS
- Cannot invalidate individual tokens server-side (must wait for expiry)
- Token payload is base64-encoded (not encrypted), sensitive data must be excluded
- Fallback secret in code is a security risk for production

**Mitigation:**
- Use `httpOnly` cookies for production deployment (planned improvement)
- Implement token refresh mechanism for long-lived sessions
- Set `JWT_SECRET` via environment variable in production

---

## ADR-005: Use Inline SVG Charts Over Chart.js

### Context

The Progress page needed to display weight and body fat trend charts. Options: Chart.js (popular charting library) or custom SVG charts drawn inline in Angular templates.

### Decision

Implement charts using inline SVG elements directly in Angular templates, with computed signals for data transformation.

```html
<svg [attr.viewBox]="'0 0 ' + chartWidth + ' ' + chartHeight" class="w-full max-h-64">
  <polyline [attr.points]="weightPoints()" fill="none" stroke="#0c8ee7" ... />
  <circle *ngFor="..." />
</svg>
```

Chart math (scaling, grid lines, axis labels) is handled by computed signals:

```typescript
protected readonly weightPoints = computed(() => {
  // Map data values to SVG coordinates
  return entries.map(e => `${xScale(e.date)},${yScale(e.weight)}`).join(' ');
});
```

### Consequences

**Positive:**
- Zero charting dependencies — no Chart.js, D3, or ECharts
- Full control over appearance — matches app's design system exactly
- SVG is resolution-independent and accessible
- Integrates perfectly with Angular signals — chart re-renders when data changes
- Smaller bundle size (~30 KB saved vs. Chart.js)

**Negative:**
- More code to write and maintain (~100 lines of chart logic)
- Limited chart types — only line charts are implemented
- No built-in animations, tooltips, or legends
- Manual calculation for scales, grid lines, and axis labels

---

## ADR-006: Use Multi-Step Wizard for Workout Creation

### Context

Creating a workout involves providing basic info (name, date, duration, notes) and then adding exercises with sets/reps/weight/rest for each. The form has ~10+ fields.

### Decision

Implement a 3-step wizard in `WorkoutCreateComponent`:

1. **Details** — Workout name, date, duration, notes
2. **Exercises** — Select exercise, enter sets/reps/weight/rest, add to list
3. **Review** — Summary of all data, final save button

State is managed via individual signals at the component level:

```typescript
protected readonly currentStep = signal(0);
protected readonly workoutName = signal('');
protected readonly workoutDate = signal(new Date().toISOString().split('T')[0]);
protected readonly workoutDuration = signal(60);
protected readonly addedExercises = signal<WorkoutExercise[]>([]);
```

### Consequences

**Positive:**
- Better UX — users focus on one task at a time
- No form submission until all data is collected and reviewed
- Visual step indicator shows progress
- Easy to validate per-step (e.g., must have name before proceeding)
- Signals keep form state local to the component

**Negative:**
- More template code (~310 lines in one component)
- No Angular Reactive Forms — signals are manually managed
- No cross-step validation (e.g., date before exercise date check)

**Why Not Reactive Forms:**
- Reactive Forms add complexity with FormGroups, FormArrays, Validators
- For a wizard with sequential, independent steps, signals are simpler
- Adding validation would require writing custom validators anyway

---

## ADR-007: Use Auto-Seed Over Manual Seed Script

### Context

The application needed initial data for development and demo purposes. Options: a manual `npm run seed` script or automatic seeding on first launch.

### Decision

Use `OnModuleInit` lifecycle hook in `SeedService` to auto-seed the database when the application starts, only if the demo user doesn't already exist.

```typescript
@Injectable()
export class SeedService implements OnModuleInit {
  async onModuleInit() {
    const existing = await this.userRepository.findOne({
      where: { email: 'demo@example.com' },
    });
    if (existing) {
      this.logger.log('Seed data already exists, skipping...');
      return;
    }
    // Seed 1 user, 20 exercises, 3 workouts, 8 workout exercises, 5 progress entries
  }
}
```

### Consequences

**Positive:**
- Zero setup — clone, `npm install`, `npm start` → app is ready with data
- Idempotent — multiple restarts don't duplicate data
- Easy reset — delete the SQLite file, restart → fresh seed
- Demo evaluators see immediate value without manual steps

**Negative:**
- Seed runs on every launch (check is fast but still a DB query)
- Seed data is hardcoded in the service — modifying requires code change
- If production accidentally starts with seed module, demo user appears
- Tests must account for seed data existing

**Mitigation:**
- Exclude `SeedModule` from production builds
- Or add `SKIP_SEED=true` environment variable check

---

## ADR-008: Use Individual Signals Over Compound Form Objects

### Context

Forms throughout the app (login, register, workout create, progress entry) need to track input field values. The choice was between individual `signal()` per field or a single compound object signal.

### Decision

Use individual signals for each form field rather than a single object signal.

```typescript
// Individual signals (chosen approach)
protected readonly email = signal('');
protected readonly password = signal('');

// Instead of a compound object:
// protected readonly form = signal({ email: '', password: '' });
```

### Consequences

**Positive:**
- Each field is independently readable — no object destructuring needed
- `[(ngModel)]` binding works directly with signals
- Individual updates don't trigger re-computation of unrelated computed values
- Clearer template expressions — `{{ email() }}` vs. `{{ form().email }}`
- Simpler reset — `email.set('')` vs. `form.set({ ...form(), email: '' })`

**Negative:**
- More signals to declare for large forms (workout create has ~8 signals)
- No grouping — can't pass "the form" as a single argument to a method
- Impossible to validate the form as a whole without manual aggregation

**Why Not Reactive Forms:**
- Angular's Reactive Forms module (`FormGroup`, `FormControl`) adds significant bundle size (~8 KB minified)
- Reactive Forms require `valueChanges` subscriptions or `form.get('field')` accessors
- For simple forms (login: 2 fields, register: 3 fields), signals with `ngModel` are simpler
- The multi-step wizard with independent steps doesn't benefit from FormGroup nesting
