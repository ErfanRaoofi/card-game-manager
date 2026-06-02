import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'admin', renderMode: RenderMode.Client },
  { path: 'room', renderMode: RenderMode.Client },
  { path: 'room/*', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Prerender },
];
