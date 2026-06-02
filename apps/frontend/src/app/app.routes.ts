import { Route } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './auth.guard';

export const appRoutes: Route[] = [
  { path: '', redirectTo: 'room', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/admin').then((m) => m.Admin),
  },
  {
    path: 'room',
    canActivate: [authGuard],
    loadComponent: () => import('@fe/room').then((m) => m.Room),
  },
  {
    path: 'room/:id',
    canActivate: [authGuard],
    loadComponent: () => import('@fe/room').then((m) => m.Room),
  },
];
