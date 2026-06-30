# Frontend Architecture

## Overview

The frontend is an Angular 22 standalone application using signals, zoneless change detection, Tailwind CSS v4, and inline SVG charts. It communicates with the NestJS backend via REST API with JWT authentication.

**Tech Stack:**
- Angular 22.x (standalone, zoneless, signals)
- Tailwind CSS v4.3.x (PostCSS plugin, `@tailwindcss/postcss`)
- TypeScript 6.x
- Vitest (via @analogjs/vitest-angular) for testing
- No NgRx, no Chart.js, no external state management

---

## Signal Architecture

The application uses Angular Signals as its sole reactivity primitive. Signals are centralized in services (for HTTP-backed data) or local to components (for form state).

### Service-Level Signals (Shared State)

These signals are defined in `@Injectable({ providedIn: 'root' })` services and are consumed by multiple components:

| Service | Signals | Type | Description |
|---------|---------|------|-------------|
| **AuthService** | `isLoggedIn` | `signal<boolean>` | Whether user has a valid token |
| | `currentUser` | `signal<User\|null>` | Currently authenticated user |
| | `isLoading` | `signal<boolean>` | Login/register in progress |
| | `error` | `signal<string\|null>` | Auth error message |
| **WorkoutService** | `workouts` | `signal<Workout[]>` | All workouts for current user |
| | `currentWorkout` | `signal<Workout\|null>` | Single workout (detail view) |
| | `isLoading` | `signal<boolean>` | Loading state |
| | `error` | `signal<string\|null>` | Error message |
| **ExerciseService** | `exercises` | `signal<Exercise[]>` | All exercises from API |
| | `filteredExercises` | `signal<Exercise[]>` | Filtered/search results |
| | `isLoading` | `signal<boolean>` | Loading state |
| | `error` | `signal<string\|null>` | Error message |
| | `selectedMuscleGroup` | `signal<string\|null>` | Current muscle group filter |
| | `searchQuery` | `signal<string>` | Current search text |
| **ProgressService** | `entries` | `signal<ProgressEntry[]>` | Progress entries for current user |
| | `isLoading` | `signal<boolean>` | Loading state |
| | `error` | `signal<string\|null>` | Error message |
| **DarkModeService** | `isDark` | `signal<boolean>` | Dark mode state |

### Component-Level Signals (Local State)

These signals are scoped to a single component and not shared:

| Component | Signals | Purpose |
|-----------|---------|---------|
| **LoginComponent** | `email`, `password` | Form inputs |
| **RegisterComponent** | `name`, `email`, `password` | Form inputs |
| **WorkoutCreateComponent** | `currentStep`, `workoutName`, `workoutDate`, `workoutDuration`, `workoutNotes`, `selectedExerciseId`, `exerciseSets`, `exerciseReps`, `exerciseWeight`, `exerciseRest`, `addedExercises` | Multi-step wizard state |
| **ProgressComponent** | `entryDate`, `entryWeight`, `entryBodyFat`, `entryNotes` | Add entry form |
| **ExerciseLibraryComponent** | `expandedIds` | Track expanded instruction cards |

### Computed Signals

Computed signals (`computed()`) derive state from other signals without manual subscriptions:

```typescript
// DashboardComponent
protected readonly recentWorkouts = computed(() =>
  this.workoutService.workouts().slice(0, 5)
);
protected readonly workoutsThisMonth = computed(() => {
  const now = new Date();
  return this.workoutService.workouts().filter(w => {
    const d = new Date(w.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
});

// ProgressComponent — chart math
protected readonly weightPoints = computed(() =>
  this.makePoints(this.weightValues(), this.minWeight(), this.maxWeight()).points
);
protected readonly xAxisLabels = computed(() => {
  // Calculate evenly spaced date labels for the chart
});
```

---

## Component Tree with Inputs/Outputs

```
App (root)                            [injects: AuthService]
│
├── NavbarComponent                   [injects: AuthService, DarkModeService]
│   ├── Internal state: links[]
│   └── No inputs/outputs — reads auth/darkMode directly
│
├── RouterOutlet
│   ├── LoginComponent               [injects: AuthService]
│   │   ├── Inputs: none
│   │   ├── Outputs: none
│   │   └── Local signals: email, password
│   │
│   ├── RegisterComponent            [injects: AuthService]
│   │   └── Local signals: name, email, password
│   │
│   ├── DashboardComponent           [injects: AuthService, WorkoutService, ProgressService]
│   │   ├── Computed: timeOfDay, todayDate, recentWorkouts, workoutsThisMonth, currentWeight
│   │   └── Child Components: (via @if control flow, not @Input)
│   │       ├── LoadingSpinnerComponent   [no I/O]
│   │       ├── EmptyStateComponent       [@Input: icon, message, actionLabel]
│   │       │                             [@Output: action]
│   │       └── ErrorDisplayComponent     [@Input: message]
│   │                                     [@Output: retry]
│   │
│   ├── ExerciseLibraryComponent     [injects: ExerciseService]
│   │   ├── Local signals: expandedIds, muscleGroups
│   │   └── Same child components pattern
│   │
│   ├── WorkoutListComponent          [injects: WorkoutService]
│   │   └── Same child components pattern
│   │
│   ├── WorkoutDetailComponent        [injects: WorkoutService, ActivatedRoute]
│   │   └── Same child components pattern
│   │
│   ├── WorkoutCreateComponent        [injects: ExerciseService, WorkoutService, Router]
│   │   └── Local signals (8 form signals, 1 step signal, 1 exercise list signal)
│   │
│   ├── ProgressComponent             [injects: ProgressService]
│   │   ├── Local signals (4 form signals)
│   │   └── Chart computed signals (12 derived values)
│   │
│   └── SettingsComponent             [injects: AuthService, DarkModeService]
```

### Reusable Components

#### LoadingSpinnerComponent
```typescript
@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `<div class="animate-spin rounded-full border-4 ...">`,
})
export class LoadingSpinnerComponent {}
```
- **Inputs:** none
- **Outputs:** none

#### EmptyStateComponent
```typescript
@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `...`,
})
export class EmptyStateComponent {
  readonly icon = input<string>('📭');
  readonly message = input<string>('No data found');
  readonly actionLabel = input<string>('');
  readonly action = output<void>();
}
```

#### ErrorDisplayComponent
```typescript
@Component({
  selector: 'app-error-display',
  standalone: true,
  template: `...`,
})
export class ErrorDisplayComponent {
  readonly message = input<string>('Something went wrong');
  readonly retry = output<void>();
}
```

---

## Lazy Loading Route Configuration

The application does **not** use lazy loading at the route level — all components are eagerly loaded because the app is small enough that lazy loading adds complexity without performance benefit. Routes are defined in `app.routes.ts`:

```typescript
export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'exercises', component: ExerciseLibraryComponent, canActivate: [authGuard] },
  { path: 'workouts', component: WorkoutListComponent, canActivate: [authGuard] },
  { path: 'workouts/new', component: WorkoutCreateComponent, canActivate: [authGuard] },
  { path: 'workouts/:id', component: WorkoutDetailComponent, canActivate: [authGuard] },
  { path: 'progress', component: ProgressComponent, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
];
```

For a larger application, the lazy loading pattern would be:

```typescript
// Future lazy loading structure:
{
  path: 'workouts',
  loadComponent: () => import('./pages/workouts/workout-list.component')
    .then(m => m.WorkoutListComponent),
  canActivate: [authGuard],
  children: [
    { path: 'new', loadComponent: ... },
    { path: ':id', loadComponent: ... },
  ],
}
```

### Route Guard

The `authGuard` function checks `AuthService.isLoggedIn()` before activating protected routes:

```typescript
export const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) {
    return true;
  }
  return router.parseUrl('/auth/login');
};
```

---

## State Management Approach

The application follows a **signal-per-page** pattern with **no cross-component shared state** beyond service signals.

### Principles

1. **Data lives in services** — HTTP-backed state (workouts, exercises, progress) is managed by injectable services
2. **UI state lives in components** — Form inputs, step indicators, expanded cards are local `signal()` calls
3. **No shared mutable state** — Components don't directly modify another component's signals
4. **Flow is unidirectional** — Component → Service method → HTTP call → Signal update → Re-render

### Data Flow Pattern

```
User Interaction (click, input)
       │
       ▼
Component method (e.g., addExercise())
       │
       ▼
Service method (e.g., workoutService.createWorkout())
       │
       ▼
HTTP request (HttpClient.post)
       │
       ▼
Server response
       │
       ▼
Signal update (e.g., workouts.set(data))
       │
       ▼
Automatic re-render via Angular's signal-based change detection
```

### What's NOT Used

- **NgRx/Redux** — Overkill for 5 entities and ~10 components
- **BehaviorSubject** — Replaced by `signal()` which is simpler and zoneless-compatible
- **RxJS shareReplay/share** — Signals handle caching naturally
- **Component @Input/@Output bus** — Minimal; services handle most cross-component data needs

---

## Auth Flow

### Login

```
LoginComponent
  → email/password signals bound via [(ngModel)]
  → onLogin() calls auth.login(email, password)
  → AuthService.login() POST /api/auth/login
  → On success:
      localStorage.setItem('auth_token', res.token)
      isLoggedIn.set(true)
      getMe() → GET /api/auth/me → currentUser.set(user)
      router.navigate(['/dashboard'])
  → On error:
      error.set(err.error?.message || 'Login failed')
```

### Token Storage

- **Location:** `localStorage` under key `'auth_token'`
- **Format:** Standard JWT (base64-encoded header.payload.signature)
- **Expiration:** 7 days (set by backend)

### Auth Interceptor

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  if (token) {
    const cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
    return next(cloned);
  }
  return next(req);
};
```

Registered in `app.config.ts`:
```typescript
provideHttpClient(withInterceptors([authInterceptor]))
```

### Guard Check

The `authGuard` checks `auth.isLoggedIn()` before route activation. Since `AuthService` restores the token from localStorage in its constructor, page refreshes preserve the login state.

### Auto-Restore on Refresh

```typescript
constructor() {
  const token = this.getToken();
  if (token) {
    this.isLoggedIn.set(true);
    this.getMe();  // validates token, fetches user profile
  }
}
```

### Logout

```typescript
logout(): void {
  localStorage.removeItem('auth_token');
  this.isLoggedIn.set(false);
  this.currentUser.set(null);
  this.router.navigate(['/auth/login']);
}
```

---

## Dark Mode Implementation

### Service: DarkModeService

The `DarkModeService` manages dark mode state via a signal, persists to localStorage, and applies the `dark` CSS class to the document root.

```typescript
@Injectable({ providedIn: 'root' })
export class DarkModeService {
  readonly isDark = signal(false);

  constructor() {
    // Priority: localStorage > system preference > light
    const stored = localStorage.getItem('dark_mode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = stored === 'true' || (stored === null && prefersDark);
    this.isDark.set(initial);
    this.updateDOM(initial);

    // Auto-sync state to localStorage and DOM on every change
    effect(() => {
      const val = this.isDark();
      localStorage.setItem('dark_mode', String(val));
      this.updateDOM(val);
    });
  }

  private updateDOM(isDark: boolean): void {
    document.documentElement.classList.toggle('dark', isDark);
  }

  toggle(): void {
    this.isDark.update((v) => !v);
  }
}
```

### How It Works

1. **Initialization:** Checks localStorage first, falls back to `prefers-color-scheme` media query
2. **DOM Toggle:** `document.documentElement.classList.toggle('dark', isDark)` enables Tailwind's dark variant
3. **Persistence:** `effect()` syncs every change to localStorage
4. **UI Controls:** Toggle is available in both the navbar sidebar and the Settings page

### Tailwind v4 Dark Mode Configuration

Tailwind v4 uses the `darkMode` class-based strategy by default. The `dark` class on `<html>` enables all `dark:` variants:

```css
/* tailwind.css or styles.css — automatically configured by Tailwind v4 */
@import "tailwindcss";
```

Usage in templates:
```html
<div class="bg-white dark:bg-surface-800 text-surface-900 dark:text-white">
```

---

## Tailwind v4 Theme Configuration

The project uses Tailwind CSS v4 with its CSS-first configuration approach. The theme is extended via CSS rather than `tailwind.config.js`:

```css
/* src/styles.css */
@import "tailwindcss";

@theme {
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #0c8ee7;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;
  --color-primary-950: #172554;

  --color-surface-50: #f8fafc;
  --color-surface-100: #f1f5f9;
  --color-surface-200: #e2e8f0;
  --color-surface-300: #cbd5e1;
  --color-surface-400: #94a3b8;
  --color-surface-500: #64748b;
  --color-surface-600: #475569;
  --color-surface-700: #334155;
  --color-surface-800: #1e293b;
  --color-surface-900: #0f172a;
  --color-surface-950: #020617;
}
```

**Design Tokens:**
- **Primary:** Blue-based palette (`primary-600: #0c8ee7` as the main brand color)
- **Surface:** Slate-based neutral palette for backgrounds and text
- **Dark mode:** All components use `dark:` variants with surface-900/800 backgrounds on dark backgrounds

---

## Responsive Design

The layout adapts between desktop and mobile using Tailwind's responsive prefixes.

### Desktop (≥1024px)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ┌──────────┐                                                       │
│ │ Sidebar  │   Main Content Area                                   │
│ │ (w-64)   │                                                       │
│ │          │   p-4 with lg:pl-0 offset for sidebar                 │
│ │ 📊 Dash  │                                                       │
│ │ 🏋️ Exerc │                                                       │
│ │ 📋 Workts│                                                       │
│ │ 📈 Progr │                                                       │
│ │ ⚙️ Settings│                                                     │
│ │          │                                                       │
│ │ 🌙 🚪   │                                                       │
│ └──────────┘                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

**Desktop Layout:**
- `NavbarComponent` renders as a fixed left sidebar: `fixed inset-y-0 left-0 w-64 lg:flex hidden`
- Main content has left margin: `lg:ml-64`
- Content padding: `p-4 pb-20 lg:pb-4 lg:pl-0`
- No bottom margin needed since sidebar is always visible

### Mobile (<1024px)

```
┌──────────────────────┐
│                      │
│   Main Content       │
│                      │
│   (p-4 pb-20)        │
│   — full width       │
│   — padding bottom   │
│     for bottom nav   │
│                      │
│                      │
├──────────────────────┤
│ 📊  🏋️  📋  📈  ⚙️ │  ← Fixed bottom nav
│ Dash Exer Work Prog Set│
└──────────────────────┘
```

**Mobile Layout:**
- Sidebar is hidden: `hidden lg:flex`
- Bottom nav bar: `fixed inset-x-0 bottom-0 lg:hidden`
- Content has extra bottom padding: `pb-20` to avoid overlap with nav

### Responsive Breakpoints Used

| Prefix | Min Width | Layout |
|--------|-----------|--------|
| Default | 0 | Mobile (bottom nav, single column) |
| `sm` | 640px | Multi-column grids (exercise cards, form grids) |
| `lg` | 1024px | Desktop (sidebar + content) |

### Example: Exercise Card Grid

```html
<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  <!-- Cards switch from 1 column (mobile) to 2 (tablet) to 3 (desktop) -->
</div>
```

### Example: Form Grid

```html
<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
  <!-- Single column on mobile, two columns on tablet+ -->
</div>
```
