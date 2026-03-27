import { Routes } from '@angular/router';
import { PublicLayout } from './layouts/public-layout/public-layout';
import { authGuard } from './guards/auth.guard';
import { publicGuard } from './guards/public.guard';
import { permissionGuard } from './guards/permission.guard';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/landingpage/landingpage').then(m => m.Landingpage)
      },
      {
        path: 'group',
        canActivate: [authGuard, permissionGuard],
        data: { permissions: ['group.view'] },
        loadComponent: () => import('./pages/group/group').then(m => m.Group)
      },
      {
        path: 'user',
        canActivate: [authGuard, permissionGuard],
        data: { permissions: ['users.view'] },
        loadComponent: () => import('./pages/user/user').then(m => m.User)
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/profile/profile').then(m => m.Profile)
      },
      {
        path: 'group-detail/:id',
        canActivate: [authGuard, permissionGuard],
        data: { permissions: ['group.view'] },
        loadComponent: () => import('./pages/group-detail/group-detail').then(m => m.GroupDetail)
      },
    ]
  },
  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () => import('./pages/Auth/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    canActivate: [publicGuard],
    loadComponent: () => import('./pages/Auth/register/register').then(m => m.Register)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./pages/unauthorized/unauthorized').then(m => m.Unauthorized)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
