import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PermissionService } from '../services/permissions/permissions.service';
import { UserService } from '../services/user/user.service';

export const permissionGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const permissionService = inject(PermissionService);
  const userService = inject(UserService);
  const router = inject(Router);

  const currentUser = userService.getCurrentUser();

  if (!currentUser) {
    router.navigate(['/login']);
    return false;
  }

  const requiredPermissions = route.data['permissions'] as string[];

  if (requiredPermissions && requiredPermissions.length > 0) {
    const [page, action] = requiredPermissions[0].split('.');

    if (!permissionService.hasPermission(page, action)) {
      router.navigate(['/']);
      return false;
    }
  }

  return true;
};
