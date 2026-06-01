import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@fe/services';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ensureSession();
  if (auth.currentUser()) return true;
  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ensureSession();
  if (auth.currentUser()) return router.createUrlTree(['/room']);
  return true;
};

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ensureSession();
  if (!auth.currentUser()) return router.createUrlTree(['/login']);
  if (auth.isAdmin()) return true;
  return router.createUrlTree(['/room']);
};
