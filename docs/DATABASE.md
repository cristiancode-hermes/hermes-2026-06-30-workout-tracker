# Database Schema

## Technology

The application uses **TypeORM** with **sql.js** (SQLite compiled to WebAssembly) for local development and testing. The database file is stored at `data/workout-tracker.sqlite` relative to the API project root. The connection uses `synchronize: true`, which auto-creates tables on every launch — suitable for development but must be disabled in production.

### Production Migration Target

For production, the app is designed to switch to **PostgreSQL** (hosted on Neon). The `.env.example` file documents the connection string format:

```
# SQLite (dev)
DATABASE_URL=data/workout-tracker.sqlite

# PostgreSQL (production)
# NEON_DATABASE_URL=postgresql://user:***@ep-xxx.us-east-2.aws.neon.tech/workout-tracker?sslmode=require
```

To migrate, change the TypeORM config in `app.module.ts` from:
```typescript
TypeOrmModule.forRoot({
  type: 'sqljs',
  location: 'data/workout-tracker.sqlite',
  autoSave: true,
  synchronize: true,
  entities: [/* ... */],
})
```
to:
```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  url: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  synchronize: false,   // use migrations in production
  migrations: ['dist/migrations/*.js'],
  entities: [/* ... */],
})
```

---

## Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ Workout : "has"
    User ||--o{ ProgressEntry : "tracks"
    Workout ||--o{ WorkoutExercise : "contains"
    Exercise ||--o{ WorkoutExercise : "used in"

    User {
        int id PK
        varchar email UK "unique"
        varchar password "bcrypt hashed"
        varchar name
        datetime createdAt "auto-set"
    }

    Exercise {
        int id PK
        varchar name
        varchar muscleGroup "enum: chest|back|legs|shoulders|arms|core|cardio|full_body"
        varchar equipment "enum: barbell|dumbbell|machine|cable|bodyweight|other"
        text instructions "nullable"
        varchar type "enum: strength|cardio|flexibility"
    }

    Workout {
        int id PK
        varchar name
        date date
        int duration "minutes, nullable"
        text notes "nullable"
        int userId FK "-> User.id"
    }

    WorkoutExercise {
        int id PK
        int workoutId FK "-> Workout.id, cascades on delete"
        int exerciseId FK "-> Exercise.id"
        int sets "nullable"
        int reps "nullable"
        float weight "kg, nullable"
        int restSeconds "nullable"
        int order "nullable"
    }

    ProgressEntry {
        int id PK
        int userId FK "-> User.id, cascades on delete"
        date date
        float weight "kg, nullable"
        float bodyFat "percentage, nullable"
        text notes "nullable"
    }
```

---

## Full Table Descriptions

### 1. User — `users`

Stores registered user accounts. Passwords are hashed with bcryptjs (10 salt rounds) before storage. The `createdAt` timestamp is auto-set by TypeORM's `@CreateDateColumn`.

| Column    | Type         | Constraints          | Description                          |
|-----------|--------------|----------------------|--------------------------------------|
| `id`      | INT          | PK, AUTO_INCREMENT   | Unique user identifier               |
| `email`   | VARCHAR(255) | NOT NULL, UNIQUE     | Email address (used for login)       |
| `password`| VARCHAR(255) | NOT NULL             | bcrypt hash of the password          |
| `name`    | VARCHAR(255) | NOT NULL             | Display name                         |
| `createdAt`| DATETIME    | NOT NULL, DEFAULT NOW | Auto-set by TypeORM on creation     |

**Relationships:**
- `User 1:N Workout` — a user can have many workouts (`user.workouts`)
- `User 1:N ProgressEntry` — a user can have many progress entries (`user.progressEntries`)

**Indexes:**
- Primary key on `id`
- Unique index on `email`

### 2. Exercise — `exercises`

A catalog of exercises that can be added to workouts. Pre-seeded with 20 exercises spanning 8 muscle groups. Exercises are shared across all users (not user-specific).

| Column         | Type         | Constraints        | Description                                      |
|----------------|--------------|--------------------|--------------------------------------------------|
| `id`           | INT          | PK, AUTO_INCREMENT | Unique exercise identifier                       |
| `name`         | VARCHAR(255) | NOT NULL           | Exercise name (e.g., "Bench Press")              |
| `muscleGroup`  | VARCHAR(50)  | NOT NULL           | Target muscle group (enum, see below)            |
| `equipment`    | VARCHAR(50)  | NOT NULL           | Required equipment (enum, see below)             |
| `instructions` | TEXT         | NULLABLE           | Detailed form instructions                       |
| `type`         | VARCHAR(50)  | NOT NULL           | Exercise type (enum: strength, cardio, flexibility) |

**MuscleGroup Enum:**
`'chest'`, `'back'`, `'legs'`, `'shoulders'`, `'arms'`, `'core'`, `'cardio'`, `'full_body'`

**Equipment Enum:**
`'barbell'`, `'dumbbell'`, `'machine'`, `'cable'`, `'bodyweight'`, `'other'`

**ExerciseType Enum:**
`'strength'`, `'cardio'`, `'flexibility'`

**Relationships:**
- `Exercise 1:N WorkoutExercise` — an exercise can appear in many workout entries (`exercise.workoutExercises`)

### 3. Workout — `workouts`

Represents a single workout session. Each workout belongs to a specific user and contains a collection of exercises through the WorkoutExercise join table.

| Column    | Type         | Constraints                    | Description                      |
|-----------|--------------|--------------------------------|----------------------------------|
| `id`      | INT          | PK, AUTO_INCREMENT             | Unique workout identifier        |
| `name`    | VARCHAR(255) | NOT NULL                       | Workout name (e.g., "Push Day")  |
| `date`    | DATE         | NOT NULL                       | Date the workout was performed   |
| `duration`| INT          | NULLABLE                       | Duration in minutes              |
| `notes`   | TEXT         | NULLABLE                       | Free-text notes about the session|
| `userId`  | INT          | NOT NULL, FK -> users.id       | Owner of this workout            |

**Relationships:**
- `Workout N:1 User` — each workout belongs to one user (`workout.user`), cascade delete
- `Workout 1:N WorkoutExercise` — a workout contains many exercise entries (`workout.exercises`), cascade persist

**Indexes:**
- Primary key on `id`
- Foreign key on `userId` → `users.id`

### 4. WorkoutExercise — `workout_exercises`

Join table linking workouts to exercises, with additional fields for sets, reps, weight, rest time, and ordering. This is the "line items" of a workout. The `exercise` relation is loaded eagerly by default (`{ eager: true }`).

| Column        | Type   | Constraints                              | Description                      |
|---------------|--------|------------------------------------------|----------------------------------|
| `id`          | INT    | PK, AUTO_INCREMENT                       | Unique identifier                |
| `workoutId`   | INT    | NOT NULL, FK -> workouts.id, CASCADE     | Parent workout                   |
| `exerciseId`  | INT    | NOT NULL, FK -> exercises.id             | Exercise performed               |
| `sets`        | INT    | NULLABLE                                 | Number of sets performed         |
| `reps`        | INT    | NULLABLE                                 | Number of reps per set           |
| `weight`      | FLOAT  | NULLABLE                                 | Weight used in kg                |
| `restSeconds` | INT    | NULLABLE                                 | Rest time between sets in seconds|
| `order`       | INT    | NULLABLE                                 | Display order within the workout |

**Relationships:**
- `WorkoutExercise N:1 Workout` — cascades on delete (`workout.exercises`)
- `WorkoutExercise N:1 Exercise` — eager loaded (`workoutExercise.exercise`)

**Indexes:**
- Primary key on `id`
- Foreign key on `workoutId` → `workouts.id` (CASCADE)
- Foreign key on `exerciseId` → `exercises.id`

### 5. ProgressEntry — `progress_entries`

Tracks body metrics over time — body weight, body fat percentage, and optional notes. Each entry belongs to a user.

| Column    | Type   | Constraints                    | Description                      |
|-----------|--------|--------------------------------|----------------------------------|
| `id`      | INT    | PK, AUTO_INCREMENT             | Unique identifier                |
| `userId`  | INT    | NOT NULL, FK -> users.id       | Owner of this entry              |
| `date`    | DATE   | NOT NULL                       | Date of measurement              |
| `weight`  | FLOAT  | NULLABLE                       | Body weight in kg                |
| `bodyFat` | FLOAT  | NULLABLE                       | Body fat percentage              |
| `notes`   | TEXT   | NULLABLE                       | Free-text notes                  |

**Relationships:**
- `ProgressEntry N:1 User` — each entry belongs to one user (`progress.user`), cascade delete

---

## Key Relationships Summary

| Relationship | Type | Source → Target | Foreign Key | Cascade |
|-------------|------|----------------|-------------|---------|
| User → Workout | 1:N | user.id ← workout.userId | `workout.userId` | DELETE CASCADE |
| User → ProgressEntry | 1:N | user.id ← progress_entry.userId | `progress_entries.userId` | DELETE CASCADE |
| Workout → WorkoutExercise | 1:N | workout.id ← workout_exercise.workoutId | `workout_exercises.workoutId` | DELETE CASCADE |
| Exercise → WorkoutExercise | 1:N | exercise.id ← workout_exercise.exerciseId | `workout_exercises.exerciseId` | None (read-only) |

---

## Migration Strategy: SQLite → PostgreSQL

### Development (SQLite / sql.js)

```typescript
TypeOrmModule.forRoot({
  type: 'sqljs',
  location: 'data/workout-tracker.sqlite',  // file-based
  autoSave: true,                             // persist changes to disk
  synchronize: true,                          // auto-create/update tables
  entities: [User, Exercise, Workout, WorkoutExercise, ProgressEntry],
})
```

Advantages:
- Zero configuration — no database server needed
- Entire DB is a single file, easy to reset by deleting it
- Fast for local development and testing

Limitations:
- Not suitable for concurrent access
- No migration management (synchronize is destructive in production)
- Limited SQL features compared to PostgreSQL

### Production (PostgreSQL on Neon)

```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  url: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  synchronize: false,          // REQUIRED: disable in production
  migrationsRun: true,
  migrations: ['dist/migrations/*.js'],
  entities: [/* ... */],
})
```

**Migration Steps:**

1. **Generate migrations** — Run `npx typeorm migration:generate` to capture the current schema
2. **Review and edit** — Manually review the generated SQL for PostgreSQL compatibility
3. **Run migrations** — Execute `npx typeorm migration:run` against the Neon database
4. **Switch connection config** — Change the `TypeOrmModule.forRoot()` configuration
5. **Disable sync** — Set `synchronize: false` to prevent accidental schema changes
6. **Seed data** — The `SeedService` checks for existing demo user and skips if found, so it's safe for production

**SQLite → PostgreSQL Differences to Watch For:**

| Feature | SQLite | PostgreSQL | Action Required |
|---------|--------|------------|-----------------|
| Auto-increment | `AUTOINCREMENT` | `SERIAL` or `IDENTITY` | Migration handles this |
| Date type | `date` string | `DATE` type | Cast in queries |
| Float | `REAL` | `DOUBLE PRECISION` or `FLOAT` | Migration handles this |
| Enums | Stored as varchar | Can use `CREATE TYPE` | Add enum types |
| Cascading | ON DELETE CASCADE | ON DELETE CASCADE | Same syntax |
| Boolean | 0/1 integer | BOOLEAN type | Not used in schema |

---

## Seed Data Approach

The `SeedService` implements `OnModuleInit` and runs automatically when the application starts. It checks if a user with email `demo@example.com` already exists — if found, it skips seeding entirely (idempotent on restart).

### What Gets Seeded

| Entity | Records | Details |
|--------|---------|---------|
| User | 1 | `demo@example.com` / `demo123` (bcrypt hashed), name: "Demo User" |
| Exercise | 20 | 8 chest/back/legs/shoulders/arms/core/cardio/full_body exercises |
| Workout | 3 | "Push Day", "Leg Day", "Pull Day" with dates 2026-06-28 through 2026-06-30 |
| WorkoutExercise | 8 | 3 exercises for Push Day, 3 for Leg Day, 2 for Pull Day |
| ProgressEntry | 5 | Weekly entries from 2026-06-01 to 2026-06-29 |

### Seed Logic

```typescript
async onModuleInit() {
  const existing = await this.userRepository.findOne({
    where: { email: 'demo@example.com' },
  });
  if (existing) {
    this.logger.log('Seed data already exists, skipping...');
    return;
  }
  // ... create demo user, exercises, workouts, progress entries
}
```

This approach ensures:
- **Idempotency** — Running seed multiple times doesn't duplicate data
- **Fresh start** — Deleting `data/workout-tracker.sqlite` triggers re-seed on next launch
- **No manual commands needed** — The app seeds itself on first run
- **Safe for demo deployments** — Demo user always available for evaluation
- **Not for production** — The seed module should be excluded in production builds or the check ensures it only runs once
