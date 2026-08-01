import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { User, AuthResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly isLoggedIn = signal(false);
  readonly currentUser = signal<User | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  private tokenKey = 'auth_token';

  constructor() {
    const token = this.getToken();
    if (token) {
      this.isLoggedIn.set(true);
      this.getMe();
    }
  }

  login(email: string, password: string): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.post<AuthResponse>('/api/auth/login', { email, password }).subscribe({
      next: (res) => {
        localStorage.setItem(this.tokenKey, res.token);
        this.isLoggedIn.set(true);
        this.isLoading.set(false);
        this.getMe();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err.error?.message || 'Login failed');
      },
    });
  }

  register(email: string, password: string, name: string): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.post<AuthResponse>('/api/auth/register', { email, password, name }).subscribe({
      next: (res) => {
        localStorage.setItem(this.tokenKey, res.token);
        this.isLoggedIn.set(true);
        this.isLoading.set(false);
        this.getMe();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err.error?.message || 'Registration failed');
      },
    });
  }

  getMe(): void {
    const token = this.getToken();
    if (!token) return;
    this.http.get<User>('/api/auth/me').subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.isLoggedIn.set(true);
      },
      error: () => {
        this.currentUser.set(null);
      },
    });
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }
}
