import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'endeavors', pathMatch: 'full' },
  {
    path: 'endeavors',
    loadComponent: () =>
      import('./features/endeavors/endeavor-list/endeavor-list').then((m) => m.EndeavorList),
  },
  {
    path: 'endeavors/new',
    loadComponent: () =>
      import('./features/endeavors/endeavor-form/endeavor-form').then((m) => m.EndeavorForm),
  },
  {
    path: 'endeavors/:id',
    loadComponent: () =>
      import('./features/endeavors/endeavor-detail/endeavor-detail').then(
        (m) => m.EndeavorDetail,
      ),
  },
  {
    path: 'endeavors/:id/edit',
    loadComponent: () =>
      import('./features/endeavors/endeavor-form/endeavor-form').then((m) => m.EndeavorForm),
  },
];
