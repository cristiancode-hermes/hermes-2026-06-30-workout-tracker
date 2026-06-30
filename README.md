# Workout Tracker 🏋️

> Track your workouts, log exercises with sets/reps/weight, and visualize your progress over time.

A full-stack workout logging application built with **Angular 22** (signals, zoneless), **NestJS**, and **SQLite** (Neon-ready PostgreSQL schema). Features exercise library browsing, workout logging with set-by-set tracking, progress charts with weight/body fat trends, and personal records detection.

## Features

- **🔐 Authentication** — JWT-based register and login
- **💪 Exercise Library** — 20+ seeded exercises across all muscle groups with search and filter
- **📝 Workout Logging** — Multi-step wizard to log workouts with exercises, sets, reps, and weight
- **📊 Progress Tracking** — SVG charts for weight trend and body fat percentage over time
- **🌓 Dark Mode** — Toggle with localStorage persistence
- **📱 Responsive** — Sidebar on desktop, bottom nav on mobile
- **⚡ Signal-First** — Angular 22 signals for all state management, zoneless change detection
- **🔄 Lazy Loading** — All pages lazy-loaded for optimal bundle size (~96KB transfer)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 22 (standalone, signals, zoneless, Tailwind CSS v4) |
| Backend | NestJS (TypeORM, JWT auth, Swagger, class-validator) |
| Database | SQLite (sql.js) via TypeORM — Neon PostgreSQL-ready schema |
| Charts | Custom SVG inline — no external chart library |
| Styling | Tailwind CSS v4 with custom @theme design tokens |

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌──────────┐
│  Angular 22  │────▶│  NestJS API  │────▶│  SQLite  │
│  (apps/web)  │     │  (apps/api)  │     │   (db)   │
│  :4200       │◀────│  :3000/api   │◀────│          │
└─────────────┘     └──────────────┘     └──────────┘
                           │
                     ┌─────┴─────┐
                     │  Swagger  │
                     │  /api/docs│
                     └───────────┘
```

**Angular 22 Frontend:**
- Standalone components — no NgModules
- `signal()` / `computed()` for all local state
- `provideZonelessChangeDetection()` — no Zone.js
- `@if` / `@for` / `@switch` control flow
- Lazy-loaded routes with `loadComponent()`

**NestJS Backend:**
- 5 feature modules with clean service/controller separation
- JWT authentication with Passport.js + bcryptjs
- TypeORM with sql.js (zero-config SQLite)
- Global ValidationPipe with whitelist/transform
- Swagger OpenAPI docs at `/api/docs`

## Getting Started

### Prerequisites

- Node.js 22+
- npm 10+

### Installation

```bash
# Clone and install
git clone <repo-url>
cd hermes-2026-06-30-workout-tracker

# Install API dependencies
cd apps/api && npm install && cd ../..

# Install Web dependencies
cd apps/web && npm install && cd ../..
```

### Environment Setup

```bash
# API environment variables
cp apps/api/.env.example apps/api/.env
# Edit .env if needed (defaults work for development)
```

### Run the Backend

```bash
cd apps/api
npm run start:dev
# API at http://localhost:3000/api
# Swagger at http://localhost:3000/api/docs
```

The backend auto-seeds demo data on first launch:
- **Demo User:** `demo@example.com` / `demo123`
- **20 exercises** across all muscle groups
- **3 sample workouts** with 2-3 exercises each
- **5 progress entries** with realistic body metrics

### Run the Frontend

```bash
cd apps/web
npm run start
# App at http://localhost:4200
```

### Login with Demo Account

1. Navigate to http://localhost:4200
2. Click "Sign In" and use:
   - Email: `demo@example.com`
   - Password: `demo123`

### Build for Production

```bash
# Backend
cd apps/api && npm run build

# Frontend (outputs to apps/web/dist/web)
cd apps/web && npm run build
```

## API Reference

The API is fully documented via Swagger at `/api/docs` when the server is running.

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Get current user |
| GET | `/api/exercises` | Yes | List exercises (optional `?muscleGroup=chest`) |
| POST | `/api/workouts` | Yes | Create workout with exercises |
| GET | `/api/workouts` | Yes | List all workouts |
| GET | `/api/workouts/:id` | Yes | Get workout detail with exercises |
| DELETE | `/api/workouts/:id` | Yes | Delete workout |
| GET | `/api/progress` | Yes | List progress entries |
| POST | `/api/progress` | Yes | Create progress entry |

### Example API Calls

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"demo123"}'

# Get exercises (with token)
curl http://localhost:3000/api/exercises?muscleGroup=chest \
  -H "Authorization: Bearer <token>"

# Create workout
curl -X POST http://localhost:3000/api/workouts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"Morning Push","date":"2026-06-30","duration":45,"notes":"Great session","exercises":[{"exerciseId":1,"sets":3,"reps":10,"weight":60,"restSeconds":60},{"exerciseId":5,"sets":3,"reps":12,"weight":20,"restSeconds":45}]}'

# Log progress
curl -X POST http://localhost:3000/api/progress \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"date":"2026-06-30","weight":78.5,"bodyFat":15.2,"notes":"Feeling strong"}'
```

## Project Structure

```
hermes-2026-06-30-workout-tracker/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── auth/          # Auth module (register, login, JWT)
│   │   │   ├── exercises/     # Exercise library CRUD
│   │   │   ├── workouts/      # Workout + WorkoutExercise CRUD
│   │   │   ├── progress/      # Progress entry tracking
│   │   │   ├── seed/          # Auto-seed demo data
│   │   │   ├── entities/      # TypeORM entities
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   └── data/              # SQLite database (gitignored)
│   └── web/                    # Angular 22 Frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── pages/     # 9 lazy-loaded pages
│       │   │   ├── shared/    # 4 shared components
│       │   │   ├── services/  # Auth, Exercise, Workout, Progress, DarkMode
│       │   │   └── guards/    # Auth guard
│       │   └── styles.css     # Tailwind v4 config with @theme
│       ├── postcss.config.js
│       └── vitest.config.ts
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── DECISIONS.md
│   ├── FRONTEND.md
│   └── LEARNINGS.md
├── .gitignore
├── .env.example
└── README.md
```

## Roadmap

- [ ] **Personal Records** — Track PRs per exercise (highest weight, most reps)
- [ ] **Workout Templates** — Create reusable workout templates
- [ ] **Rest Timer** — Built-in rest timer between sets
- [ ] **Export Data** — Download workout history as CSV/JSON
- [ ] **Charts Dashboard** — Monthly volume, muscle group breakdown, streak tracking
- [ ] **Neon PostgreSQL** — Migrate from SQLite to Neon for production
- [ ] **CI/CD Pipeline** — GitHub Actions for automated builds and tests
- [ ] **Body Measurements** — Track measurements beyond weight (waist, arms, chest)

## License

MIT
