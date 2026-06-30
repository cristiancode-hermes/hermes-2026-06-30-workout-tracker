# Workout Tracker — System Architecture

## Overview

Workout Tracker is a full-stack single-page application built with Angular 22 and NestJS 11. It uses SQLite via sql.js for local development with an upgrade path to PostgreSQL for production. The frontend communicates with the backend through a RESTful HTTP API secured by JWT authentication.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser (Angular SPA)                        │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Dashboard │  │ Workouts │  │Progress  │  │   Exercise Lib    │  │
│  │ Component │  │ Pages    │  │Component │  │   Component       │  │
│  └─────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│        │              │              │                 │             │
│  ┌─────┴──────────────┴──────────────┴─────────────────┴─────────┐  │
│  │                  Angular Services (signals)                     │  │
│  │  AuthService  │  WorkoutService  │  ExerciseService             │  │
│  │  ProgressService  │  DarkModeService                            │  │
│  └────────────────────────────┬────────────────────────────────────┘  │
│                               │                                       │
│  ┌────────────────────────────┴────────────────────────────────────┐  │
│  │              HTTP Interceptor (Bearer Token)                     │  │
│  └────────────────────────────┬────────────────────────────────────┘  │
└───────────────────────────────┼────────────────────────────────────────┘
                                │ HTTP REST API (port 3000)
                                │ /api/auth, /api/exercises, /api/workouts, /api/progress
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       NestJS Backend                                 │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   AppModule (root)                            │   │
│  │  ConfigModule │ TypeOrmModule │ ServeStaticModule             │   │
│  │  ┌──────┬───────┬────────┬──────────┬──────────┐              │   │
│  │  │ Auth │Exercises│Workouts│ Progress │  Seed   │              │   │
│  │  │Module│ Module │ Module │  Module  │ Module  │              │   │
│  │  └──┬───┴───┬────┴───┬────┴────┬─────┴────┬─────┘              │   │
│  │     │       │        │         │          │                    │   │
│  │  ┌──┴───┐┌──┴───┐┌──┴───┐┌───┴────┐┌─────┴──────┐              │   │
│  │  │Auth  ││Exerc.││Workt.││Progress││  Seed      │              │   │
│  │  │Svc   ││Svc   ││Svc   ││ Svc    ││  Service   │              │   │
│  │  └──────┘└──────┘└──────┘└────────┘└────────────┘              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                               │                                      │
│  ┌────────────────────────────┴────────────────────────────────────┐  │
│  │                    TypeORM / sql.js                              │  │
│  │                                                                  │  │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────────┐     │  │
│  │  │  User   │  │ Exercise │  │ Workout │  │WorkoutExerc. │     │  │
│  │  ├─────────┤  ├──────────┤  ├─────────┤  ├──────────────┤     │  │
│  │  │Progress │  │          │  │         │  │              │     │  │
│  │  │Entry    │  │          │  │         │  │              │     │  │
│  │  └─────────┘  └──────────┘  └─────────┘  └──────────────┘     │  │
│  └────────────────────────────┬────────────────────────────────────┘  │
└───────────────────────────────┼────────────────────────────────────────┘
                                │
                                ▼
                    ┌─────────────────────┐
                    │   SQLite Database    │
                    │ (data/workout-tracker│
                    │      .sqlite)        │
                    └─────────────────────┘
```

---

## High-Level System Diagram

```
┌──────────────┐       HTTP       ┌──────────────┐      TypeORM      ┌──────────┐
│              │   (port 3000)    │              │                   │          │
│  Angular 22  │ ────────────────>│  NestJS 11   │ ────────────────> │  SQLite  │
│  (standalone │                  │  (API + SPA) │                   │  (sql.js)│
│   + signals) │ <────────────────│              │ <──────────────── │          │
│              │   JSON Response  │              │      Entities     │          │
└──────────────┘                 └──────────────┘                   └──────────┘
       │                                                                │
       │                         ┌──────────────┐                     │
       │                         │  PostgreSQL  │  (production target) │
       │                         │  (Neon)      │                     │
       │                         └──────────────┘                     │
       │                                                                │
  ┌─────────────┐                                                      │
  │ Tailwind v4 │                                                      │
  │ Dark Mode   │                                                      │
  │ Responsive  │                                                      │
  └─────────────┘                                                      │
```

The NestJS server also serves the compiled Angular SPA via `@nestjs/serve-static` at the root path, making it a single deployment unit. API routes are prefixed with `/api` to avoid conflicts.

---

## Angular Component Tree with Lazy Loading Routes

All routes in this application are **eagerly loaded** (not lazy) since the app is small enough. The route definitions live in `app.routes.ts` with guards applied through Angular's `canActivate`:

```
Router (app.routes.ts)
│
├── /auth/login         →  LoginComponent
├── /auth/register      →  RegisterComponent
├── /dashboard          →  DashboardComponent        [authGuard]
├── /exercises          →  ExerciseLibraryComponent   [authGuard]
├── /workouts           →  WorkoutListComponent       [authGuard]
├── /workouts/new       →  WorkoutCreateComponent     [authGuard]
├── /workouts/:id       →  WorkoutDetailComponent     [authGuard]
├── /progress           →  ProgressComponent          [authGuard]
└── /settings           →  SettingsComponent          [authGuard]
```

### Component Tree

```
App (root component)
├── NavbarComponent (if logged in)
│   ├── Sidebar (desktop — `lg:flex hidden`)
│   │   ├── Nav links (Dashboard, Exercises, Workouts, Progress, Settings)
│   │   ├── Dark mode toggle
│   │   ├── Logout button
│   │   └── User name display
│   └── Bottom Nav (mobile — `lg:hidden`)
│       └── Nav links (same as sidebar)
├── RouterOutlet
│   ├── LoginComponent
│   │   └── email, password signals → AuthService.login()
│   ├── RegisterComponent
│   │   └── name, email, password signals → AuthService.register()
│   ├── DashboardComponent
│   │   ├── LoadingSpinnerComponent
│   │   ├── EmptyStateComponent
│   │   ├── ErrorDisplayComponent
│   │   └── computed signals (timeOfDay, recentWorkouts, currentWeight, etc.)
│   ├── ExerciseLibraryComponent
│   │   ├── Search input → ExerciseService.search()
│   │   ├── Muscle group filter buttons
│   │   ├── LoadingSpinnerComponent
│   │   ├── EmptyStateComponent
│   │   ├── ErrorDisplayComponent
│   │   └── Exercise cards grid with expandable instructions
│   ├── WorkoutListComponent
│   │   ├── LoadingSpinnerComponent
│   │   ├── EmptyStateComponent
│   │   ├── ErrorDisplayComponent
│   │   └── Workout cards list
│   ├── WorkoutDetailComponent
│   │   ├── LoadingSpinnerComponent
│   │   ├── ErrorDisplayComponent
│   │   ├── Workout header (name, date, duration, notes)
│   │   ├── Exercises table (name, sets, reps, weight, rest)
│   │   └── Delete button
│   ├── WorkoutCreateComponent (multi-step wizard)
│   │   ├── Step 1: Workout Details (name, date, duration, notes)
│   │   ├── Step 2: Add Exercises (selector, sets/reps/weight/rest inputs)
│   │   ├── Step 3: Review & Save
│   │   └── Step navigation (Previous / Next buttons)
│   ├── ProgressComponent
│   │   ├── Add entry form (date, weight, bodyFat, notes)
│   │   ├── SVG weight trend chart
│   │   ├── SVG body fat trend chart
│   │   ├── Entries table
│   │   ├── LoadingSpinnerComponent
│   │   ├── EmptyStateComponent
│   │   └── ErrorDisplayComponent
│   └── SettingsComponent
│       ├── Profile info (name, email)
│       ├── Dark mode toggle switch
│       ├── App info (version, framework)
│       └── Logout button
```

### Reusable Components

| Component | Inputs | Outputs | Description |
|-----------|--------|---------|-------------|
| `LoadingSpinnerComponent` | — | — | Animated spinner with Tailwind CSS |
| `EmptyStateComponent` | `icon`, `message`, `actionLabel` | `action` | Centered empty state with optional action button |
| `ErrorDisplayComponent` | `message` | `retry` | Error card with retry button |

---

## NestJS Module Dependency Graph

```
                    ┌──────────────┐
                    │  AppModule   │
                    │              │
                    │  ┌────────┐  │
                    │  │Config  │  │  (global, provides env vars)
                    │  │Module  │  │
                    │  └────────┘  │
                    │  ┌────────┐  │
                    │  │TypeOrm │  │  (sql.js, entities: User, Exercise,
                    │  │Module  │  │   Workout, WorkoutExercise, ProgressEntry)
                    │  └────────┘  │
                    │  ┌────────┐  │
                    │  │ServeSta│  │  (serves frontend dist)
                    │  │tic     │  │
                    │  └────────┘  │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┬───────────────┐
          │                │                │               │
          ▼                ▼                ▼               ▼
   ┌──────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐
   │ AuthMod. │   │ExercisesMod│   │WorkoutsMod │   │ProgressMod │
   │          │   │            │   │            │   │            │
   │provides: │   │provides:   │   │provides:   │   │provides:   │
   │JwtStrat. │   │Exercises   │   │WorkoutsSvc │   │ProgressSvc │
   │AuthSvc   │   │Controller  │   │Controller  │   │Controller  │
   │          │   │            │   │            │   │            │
   │exports:  │   │repos:      │   │repos:      │   │repos:      │
   │JwtStrat. │   │Exercise    │   │Workout     │   │Progress    │
   │Passport  │   │            │   │WorkoutExer │   │Entry       │
   │Module    │   │            │   │            │   │            │
   └──────────┘   └────────────┘   └────────────┘   └────────────┘
                                      │
                                      │ imports TypeOrmModule
                                      │ for WorkoutExercise
                                      ▼
                               ┌────────────┐
                               │ SeedModule │  (OnModuleInit — auto-seeds
                               │            │   on first launch if demo
                               │            │   user doesn't exist)
                               │provides:   │
                               │SeedService │
                               └────────────┘

Key flows:
  AuthModule  ──exports──> JwtStrategy + PassportModule ──used_by──> All other modules
  WorkoutsModule ──imports──> TypeOrmModule.forFeature([WorkoutExercise])
  SeedModule ──imports──> TypeOrmModule.forFeature([all 5 entities])
```

### Module Dependency Details

| Module | Imports | Providers | Exports | Controllers |
|--------|---------|-----------|---------|-------------|
| **AuthModule** | TypeOrmModule.forFeature([User]), PassportModule, JwtModule | AuthService, JwtStrategy | AuthService, JwtStrategy, PassportModule | AuthController |
| **ExercisesModule** | TypeOrmModule.forFeature([Exercise]) | ExercisesService | — | ExercisesController |
| **WorkoutsModule** | TypeOrmModule.forFeature([Workout, WorkoutExercise]) | WorkoutsService | — | WorkoutsController |
| **ProgressModule** | TypeOrmModule.forFeature([ProgressEntry]) | ProgressService | — | ProgressController |
| **SeedModule** | TypeOrmModule.forFeature([User, Exercise, Workout, WorkoutExercise, ProgressEntry]) | SeedService | — | — |

---

## Data Flow — Creating a Workout

```
User fills in WorkoutCreateComponent (3-step wizard)
│
│  Step 1: name, date, duration, notes → local signals
│  Step 2: select exercises → addExercise() → addedExercises signal
│  Step 3: Review → clicks "Save Workout"
│
▼
WorkoutCreateComponent.saveWorkout()
│
│  Builds WorkoutCreateRequest from signals:
│  {
│    name: "Push Day",
│    date: "2026-06-30",
│    duration: 45,
│    notes: "Good session",
│    exercises: [
│      { exerciseId: 1, sets: 4, reps: 8, weight: 80, restSeconds: 90 },
│      { exerciseId: 10, sets: 3, reps: 8, weight: 40, restSeconds: 90 }
│    ]
│  }
│
▼
WorkoutService.createWorkout()
│
│  this.http.post<Workout>('/api/workouts', workoutData)
│
│  AuthInterceptor attaches header:
│  Authorization: Bearer <JWT token from localStorage>
│
▼
NestJS Router → WorkoutsController.create()
│
│  @Request() req.user.id = 1 (from JWT strategy validate())
│  @Body() createWorkoutDto → validated via class-validator
│
▼
WorkoutsService.create(userId, createWorkoutDto)
│
│  1. Save Workout entity:
│     INSERT INTO workouts (name, date, duration, notes, userId)
│     VALUES ('Push Day', '2026-06-30', 45, '...', 1)
│
│  2. For each exercise in DTO:
│     INSERT INTO workout_exercises (workoutId, exerciseId, sets, reps, weight, restSeconds, order)
│     VALUES (1, 1, 4, 8, 80, 90, 1)
│     INSERT INTO workout_exercises (workoutId, exerciseId, sets, reps, weight, restSeconds, order)
│     VALUES (1, 10, 3, 8, 40, 90, 2)
│
│  3. Return full Workout with relations:
│     SELECT * FROM workouts WHERE id = 1
│     SELECT * FROM workout_exercises we JOIN exercises e ON we.exerciseId = e.id WHERE workoutId = 1
│
▼
JSON Response (201 Created):
{
  "id": 1,
  "name": "Push Day",
  "date": "2026-06-30",
  "duration": 45,
  "notes": "Good session",
  "userId": 1,
  "exercises": [
    { "id": 1, "workoutId": 1, "exerciseId": 1, "sets": 4, "reps": 8, "weight": 80,
      "restSeconds": 90, "order": 1,
      "exercise": { "id": 1, "name": "Bench Press", "muscleGroup": "chest", ... } },
    { "id": 2, "workoutId": 1, "exerciseId": 10, "sets": 3, "reps": 8, "weight": 40,
      "restSeconds": 90, "order": 2,
      "exercise": { "id": 10, "name": "Overhead Press", "muscleGroup": "shoulders", ... } }
  ]
}
│
▼
WorkoutService receives response → currentWorkout.set(data)
  → Component navigates to /workouts
  → User sees new workout in the list
```

---

## Auth Flow — JWT Token Lifecycle

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         JWT AUTHENTICATION FLOW                          │
└──────────────────────────────────────────────────────────────────────────┘

                    REGISTRATION / LOGIN
                    ───────────────────
User enters email + password
        │
        ▼
LoginComponent / RegisterComponent
        │  calls AuthService.login() / .register()
        ▼
AuthService → POST /api/auth/login  (or /register)
        │
        ▼
AuthController.login(loginDto)
        │  Validates via class-validator (IsEmail, IsNotEmpty)
        ▼
AuthService.login(loginDto)
        │
        │  1. Find user by email in DB
        │  2. bcrypt.compare(password, user.password)
        │  3. If invalid → 401 Unauthorized
        │  4. If valid → jwtService.sign({ sub: user.id, email: user.email })
        │     (expiresIn: '7d', secret: JWT_SECRET or 'workout-tracker-dev-secret')
        ▼
Response: { "token": "eyJhbGciOiJIUzI1NiIs..." }
        │
        ▼
AuthService receives token
        │  1. localStorage.setItem('auth_token', token)
        │  2. isLoggedIn.set(true)
        │  3. currentUser.set(user)
        │  4. router.navigate(['/dashboard'])
        ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        SUBSEQUENT API CALLS                          │
└──────────────────────────────────────────────────────────────────────┘

Angular Component / Service
        │
        ▼
HttpClient.get('/api/workouts')
        │
        ▼
AuthInterceptor (functional interceptor)
        │  auth.getToken() from localStorage
        │  if token exists → clone request with header:
        │    Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
        ▼
NestJS Server
        │
        ▼
JwtAuthGuard (extends AuthGuard('jwt'))
        │
        ▼
Passport Strategy → JwtStrategy.validate()
        │  ExtractJwt.fromAuthHeaderAsBearerToken()
        │  jwt.verify(token, secret) → payload { sub: 1, email: "..." }
        │  Find user by payload.sub in DB
        │  Return { id: 1, email: "...", name: "..." }
        │  (This gets attached to req.user)
        ▼
Controller handler receives req.user.id
        │
        ▼
Returns data scoped to that user

┌──────────────────────────────────────────────────────────────────────┐
│                     TOKEN EXPIRY / INVALID FLOW                      │
└──────────────────────────────────────────────────────────────────────┘

Request with expired/invalid token
        │
        ▼
JwtStrategy.validate() → throws UnauthorizedException()
        │
        ▼
401 Unauthorized response
        │
        ▼
Frontend receives 401
        │
        ▼
AuthService.getMe() error callback → auth.logout()
        │  localStorage.removeItem('auth_token')
        │  isLoggedIn.set(false)
        │  currentUser.set(null)
        │  router.navigate(['/auth/login'])
        ▼
User sees login page

┌──────────────────────────────────────────────────────────────────────┐
│                    AUTO-RESTORE ON PAGE LOAD                         │
└──────────────────────────────────────────────────────────────────────┘

Browser refreshes
        │
        ▼
AuthService constructor runs
        │  localStorage.getItem('auth_token')
        │  if token exists → isLoggedIn.set(true) → http.get('/api/auth/me')
        │    if valid → currentUser.set(user) → app shows Navbar
        │    if invalid → logout() → redirect to /auth/login
        ▼
AuthGuard (route guard)
        │  checks auth.isLoggedIn()
        │  if false → redirect to /auth/login via router.parseUrl()
        │  if true → allow navigation
```
