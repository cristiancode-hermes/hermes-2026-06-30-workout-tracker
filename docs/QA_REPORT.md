# QA Report — Workout Tracker 🏋️

## Resumen
✅ **PASS** — Builds exitosos, tests pasando, cobertura ampliada significativamente.

| Aspecto | Estado |
|---------|--------|
| Build API | ✅ |
| Build Web | ✅ |
| Tests API | ✅ 33/33 |
| Tests Web | ✅ 4/4 |
| Lint API | ⚠️ 139 errors, 21 warnings |
| Docs | ✅ Completos |

---

## Build

| Comando | Resultado |
|---------|-----------|
| `nest build` (API) | ✅ Compilación exitosa |
| `ng build` (Web) | ✅ 96.03 KB transfer, 5.5s |

---

## Tests

### Existentes (antes)
- **API:** 4 suites, 10 tests (AppController, AuthService, ExercisesService, ProgressService)
- **Web:** 1 suite, 2 tests (smoke test)
- **Total:** 12 tests

### Nuevos añadidos
| Archivo | Tests añadidos | Qué cubren |
|---------|---------------|------------|
| `api/src/workouts/workouts.service.spec.ts` | 12 | **Nuevo archivo completo**: create, findAll (paginación), findOne (permisos), update (con ejercicios), remove |
| `api/src/exercises/exercises.service.spec.ts` | 4 | create, findOne (existente/no existente), update, remove |
| `api/src/progress/progress.service.spec.ts` | 4 | findOne, update, remove |
| `api/src/auth/auth.service.spec.ts` | 2 | getMe (con/sin password) |
| `web/src/app/services/auth.service.spec.ts` | 2 | **Nuevo archivo**: login éxito + error (Angular vitest) |

**Total ahora: 37 tests (33 API + 4 Web), todos verdes.**

### Pendiente
- Tests de componentes Angular (Dashboard, WorkoutCreate, ProgressComponent con SVG charts)
- Tests de controladores NestJS con supertest
- Tests de integración E2E completos

---

## Auditoría

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| **Lint API** | ⚠️ | 139 errors (prettier format + `any` type issues), 21 warnings |
| **Types** | ⚠️ | Uso extensivo de `as any` en TypeORM (`save`, `find` calls). TS1240 en decoradores por incompatibilidad TypeORM/TypeScript |
| **Código** | ✅ | Buena separación service/controller, signals en frontend, componentes reutilizables (LoadingSpinner, EmptyState, ErrorDisplay) |
| **Docs** | ✅ | ARCHITECTURE.md (diagramas detallados), API.md (18 endpoints documentados), DATABASE.md, DECISIONS.md, FRONTEND.md, LEARNINGS.md |
| **Edge cases** | ⚠️ | WorkoutsService maneja ForbiddenException correctamente (usuario distinto). Falta manejo de error 401 global en frontend |
| **Seguridad** | ⚠️ | JWT guard en controllers. `JWT_SECRET` con fallback a hardcoded dev secret `'workout-tracker-dev-secret'` |
| **Responsive** | ✅ | Sidebar desktop / bottom nav mobile (Tailwind `lg:` queries) |
| **Dark mode** | ✅ | Sistema completo con localStorage + `prefers-color-scheme` |
| **SEO/SSR** | ⚠️ | Sin SSR. Angular standalone, SPA puro. Aceptable para app interna/tracker |
| **Testing del diseño** | ✅ | Design system Tailwind v4 con `@theme` aplicado. Componentes reutilizables consistentes |

---

## Issues

### [⚠️ Media] Lint con 139 errores
- **Problema:** ESLint reporta 139 errores en API, mayormente `prettier/prettier` (formato) y `@typescript-eslint/no-unsafe-*` (uso de `as any`)
- **Causa raíz:** TypeORM requiere `as any` para compatibilidad. Prettier no se ejecutó post-generación.
- **Solución:** `cd apps/api && npm run lint -- --fix` corregiría 62 errores de formato automáticamente. Los `any` type issues son trade-offs conocidos con TypeORM.
- **Impacto:** Medio. Los `as any` pueden ocultar errores de tipo en runtime.

### [⚠️ Media] JWT_SECRET hardcoded como fallback
- **Problema:** `jwt.strategy.ts` línea 17: `secretOrKey: process.env.JWT_SECRET || 'workout-tracker-dev-secret'`
- **Impacto:** En producción, si no se configura `JWT_SECRET`, cualquiera puede forjar tokens.
- **Solución:** Usar `@nestjs/config` con validación que requiera `JWT_SECRET` en producción. Eliminar fallback hardcoded.

### [📝 Baja] Test coverage incompleto
- **Faltan:** Tests de componentes Angular con TestBed (DashboardComponent, WorkoutCreateComponent multi-step wizard, ProgressComponent con SVG charts), tests E2E con supertest, tests de interceptors/guards
- **Prioridad:** Baja para MVP, pero recomendable antes de producción.

### [📝 Baja] Sin test builder en angular.json
- **Problema:** `angular.json` no tiene architect.test configurado. Tests se ejecutan vía vitest directamente.
- **Sugerencia:** Para que `ng test` funcione, añadir builder `@analogjs/vitest-angular:test` en angular.json.

### [📝 Baja] Navegación con `window.location.href`
- **Problema:** DashboardComponent línea 127: `window.location.href = '/workouts/new'` en lugar de `router.navigate()`
- **Impacto:** Causa recarga completa de página, perdiendo estado de signals.
- **Sugerencia:** Usar `Router.navigate()` como en los demás componentes.

---

## Tests nuevos (detalle)

### `apps/api/src/workouts/workouts.service.spec.ts` _(nuevo)_
- ✅ create - sin ejercicios
- ✅ create - con ejercicios
- ✅ findAll - paginación
- ✅ findAll - offset correcto
- ✅ findAll - valores por defecto
- ✅ findOne - devuelve workout
- ✅ findOne - NotFoundException
- ✅ findOne - ForbiddenException (otro usuario)
- ✅ update - campos básicos
- ✅ update - reemplazar ejercicios
- ✅ remove - borrado propio
- ✅ remove - ForbiddenException

### `apps/api/src/exercises/exercises.service.spec.ts` _(ampliado)_
- ✅ create - crear y retornar
- ✅ findOne - retornar por ID
- ✅ findOne - NotFoundException
- ✅ update - actualizar campos
- ✅ remove - eliminar

### `apps/api/src/progress/progress.service.spec.ts` _(ampliado)_
- ✅ findOne - retornar por ID
- ✅ findOne - NotFoundException
- ✅ update - actualizar campos
- ✅ remove - eliminar

### `apps/api/src/auth/auth.service.spec.ts` _(ampliado)_
- ✅ getMe - retorna usuario sin password
- ✅ getMe - UnauthorizedException

### `apps/web/src/app/services/auth.service.spec.ts` _(nuevo - Angular/vitest)_
- ✅ login - POST, isLoggedIn, navegación
- ✅ login - error handling

---

## Conclusión

El proyecto **Workout Tracker** está en buen estado. Los builds pasan limpios, todos los tests (37) están verdes, y la documentación es excelente (6 archivos detallados). Se añadieron **25 tests nuevos** cubriendo los servicios más críticos (WorkoutsService, que no tenía ningún test) y el primer test de servicio Angular.

**Puntos a mejorar antes de producción:**
1. Ejecutar `npm run lint -- --fix` y eliminar `as any` donde sea posible
2. Configurar JWT_SECRET obligatorio en producción
3. Añadir tests de componentes Angular y tests E2E
4. Reemplazar `window.location.href` por `Router.navigate()`
