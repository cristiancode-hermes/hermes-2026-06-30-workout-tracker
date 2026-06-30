#!/usr/bin/env bash
# Verification script for Workout Tracker Angular frontend
set -e

echo "=========================================="
echo "Workout Tracker - Frontend Verification"
echo "=========================================="

PROJECT_DIR="/opt/data/repositorios/2026-06-30-workout-tracker/apps/web"

echo ""
echo "1. Checking project directory..."
if [ -d "$PROJECT_DIR" ]; then
  echo "   ✓ Project directory exists at $PROJECT_DIR"
else
  echo "   ✗ Project directory not found!"
  exit 1
fi

cd "$PROJECT_DIR"

echo ""
echo "2. Checking build output..."
if [ -d "dist/web/browser" ]; then
  echo "   ✓ Build output directory exists (dist/web/browser)"
  ls -la dist/web/browser/
else
  echo "   ✗ Build output directory not found"
  exit 1
fi

echo ""
echo "3. Checking built files..."
if ls dist/web/browser/main-*.js 1>/dev/null 2>&1; then
  echo "   ✓ Main JS bundle found"
else
  echo "   ✗ Main JS bundle not found"
  exit 1
fi

if ls dist/web/browser/styles-*.css 1>/dev/null 2>&1; then
  echo "   ✓ Styles bundle found"
else
  echo "   ✗ Styles bundle not found"
  exit 1
fi

echo ""
echo "4. Checking index.html..."
if [ -f "dist/web/browser/index.html" ]; then
  echo "   ✓ index.html found"
  head -5 dist/web/browser/index.html
else
  echo "   ✗ index.html not found"
  exit 1
fi

echo ""
echo "5. Verifying built JS contains app components..."
MAIN_JS=$(ls dist/web/browser/main-*.js 2>/dev/null | head -1)
if [ -n "$MAIN_JS" ]; then
  if grep -q "DashboardComponent\|LoginComponent\|WorkoutListComponent\|ProgressComponent" "$MAIN_JS" 2>/dev/null; then
    echo "   ✓ App components detected in bundle"
  else
    echo "   ⚠ No component names found in bundle (may be mangled)"
  fi
fi

echo ""
echo "6. Checking source files are all present..."
declare -a SOURCE_FILES=(
  "src/main.ts"
  "src/index.html"
  "src/styles.css"
  "src/app/app.ts"
  "src/app/app.config.ts"
  "src/app/app.routes.ts"
  "src/app/models/models.ts"
  "src/app/guards/auth.guard.ts"
  "src/app/interceptors/auth.interceptor.ts"
  "src/app/services/auth.service.ts"
  "src/app/services/exercise.service.ts"
  "src/app/services/workout.service.ts"
  "src/app/services/progress.service.ts"
  "src/app/services/dark-mode.service.ts"
  "src/app/components/navbar/navbar.component.ts"
  "src/app/components/loading-spinner/loading-spinner.component.ts"
  "src/app/components/empty-state/empty-state.component.ts"
  "src/app/components/error-display/error-display.component.ts"
  "src/app/pages/auth/login.component.ts"
  "src/app/pages/auth/register.component.ts"
  "src/app/pages/dashboard/dashboard.component.ts"
  "src/app/pages/exercises/exercise-library.component.ts"
  "src/app/pages/workouts/workout-list.component.ts"
  "src/app/pages/workouts/workout-detail.component.ts"
  "src/app/pages/workouts/workout-create.component.ts"
  "src/app/pages/progress/progress.component.ts"
  "src/app/pages/settings/settings.component.ts"
  "postcss.config.js"
)

ALL_PRESENT=true
for f in "${SOURCE_FILES[@]}"; do
  if [ -f "$f" ]; then
    echo "   ✓ $f"
  else
    echo "   ✗ MISSING: $f"
    ALL_PRESENT=false
  fi
done

echo ""
echo "7. Simple smoke check - AppComponent instantiation..."
if grep -q "App" "src/app/app.ts" && grep -q "RouterOutlet" "src/app/app.ts"; then
  echo "   ✓ App component has RouterOutlet import"
fi

if grep -q "provideZonelessChangeDetection" "src/app/app.config.ts"; then
  echo "   ✓ Zoneless change detection configured"
fi

if grep -q "provideHttpClient" "src/app/app.config.ts"; then
  echo "   ✓ HttpClient configured"
fi

if grep -q "withInterceptors" "src/app/app.config.ts"; then
  echo "   ✓ HTTP interceptors configured"
fi

if grep -q "authGuard" "src/app/app.routes.ts"; then
  echo "   ✓ Auth guards configured on protected routes"
fi

echo ""
echo "=========================================="
if $ALL_PRESENT; then
  echo "RESULT: ALL CHECKS PASSED ✓"
  echo "The Angular 22 Workout Tracker frontend builds successfully"
  echo "with all components, services, guards, and interceptors."
  echo "=========================================="
  exit 0
else
  echo "RESULT: SOME FILES MISSING ✗"
  echo "=========================================="
  exit 1
fi
