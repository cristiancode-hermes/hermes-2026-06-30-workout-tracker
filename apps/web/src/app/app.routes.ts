import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './pages/auth/login.component';
import { RegisterComponent } from './pages/auth/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ExerciseLibraryComponent } from './pages/exercises/exercise-library.component';
import { WorkoutListComponent } from './pages/workouts/workout-list.component';
import { WorkoutDetailComponent } from './pages/workouts/workout-detail.component';
import { WorkoutCreateComponent } from './pages/workouts/workout-create.component';
import { ProgressComponent } from './pages/progress/progress.component';
import { SettingsComponent } from './pages/settings/settings.component';

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
