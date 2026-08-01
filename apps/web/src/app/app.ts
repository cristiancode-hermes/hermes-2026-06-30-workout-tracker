import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, NgClass],
  template: `
@if (auth.isLoggedIn()) {
<app-navbar />
}
<main
[ngClass]="{ 'lg:ml-64': auth.isLoggedIn() }"
class="min-h-screen bg-surface-50 dark:bg-surface-950"
>
<router-outlet />
</main>
`,
})
export class App {
  protected readonly auth = inject(AuthService);
}
