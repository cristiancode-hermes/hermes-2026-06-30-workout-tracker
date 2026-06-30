import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { Router } from '@angular/router';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
import { AuthService } from './auth.service';

setupTestBed({
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    provideHttpClientTesting(),
    AuthService,
    { provide: Router, useValue: { navigate: vi.fn() } },
  ],
});

describe('AuthService', () => {
  let authService: AuthService;
  let httpTestingController: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();

    authService = TestBed.inject(AuthService);
    // Reset signal state between tests since TestBed returns the same singleton
    authService.isLoggedIn.set(false);
    authService.isLoading.set(false);
    authService.currentUser.set(null);
    authService.error.set(null);

    httpTestingController = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);

    vi.clearAllMocks();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('login', () => {
    it('should call http.post, set isLoggedIn, and navigate to dashboard on success', () => {
      const mockResponse = { token: 'jwt_token_123' };
      const email = 'test@example.com';
      const password = 'password123';

      authService.login(email, password);

      const req = httpTestingController.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email, password });

      req.flush(mockResponse);

      // login success calls getMe(), flush that too
      const meReq = httpTestingController.expectOne('/api/auth/me');
      meReq.flush({ id: '1', email, name: 'Test User' });

      expect(authService.isLoggedIn()).toBe(true);
      expect(localStorage.getItem('auth_token')).toBe('jwt_token_123');
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should set error on login failure', () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      authService.login(email, password);

      const req = httpTestingController.expectOne('/api/auth/login');
      req.flush(
        { message: 'Invalid credentials' },
        { status: 401, statusText: 'Unauthorized' },
      );

      expect(authService.isLoggedIn()).toBe(false);
      expect(authService.error()).toBe('Invalid credentials');
      expect(authService.isLoading()).toBe(false);
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
