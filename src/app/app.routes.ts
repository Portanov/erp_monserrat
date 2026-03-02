import { Routes } from '@angular/router';
import { PublicLayout } from './layouts/public-layout/public-layout';
import { AdminLayout } from './layouts/admin-layout/admin-layout';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', loadComponent: () => import('./pages/landingpage/landingpage').then(m => m.Landingpage) },
      { path: 'group', loadComponent: () => import('./pages/group/group').then(m => m.Group)},
      { path: 'user', loadComponent: () => import('./pages/user/user').then(m => m.User) },
    ]
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/Auth/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/Auth/register/register').then(m => m.Register)
  },
  {
    path: 'admin',
    component: AdminLayout,
    children: [
    ]
  }
];
