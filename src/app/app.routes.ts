import { Routes } from '@angular/router';
import { PublicLayout } from './layouts/public-layout/public-layout';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { Landingpage } from './pages/landingpage/landingpage';
import { Login } from './pages/Auth/login/login';
import { Register } from './pages/Auth/register/register';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', component: Landingpage },
      { path: 'login', component: Login },
      { path: 'register', component: Register },
    ]
  },
  {
    path: 'admin',
    component: AdminLayout,
    children: [
    ]
  }
];
