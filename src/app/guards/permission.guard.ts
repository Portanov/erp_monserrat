import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PermissionService } from '../services/permissions/permissions.service';
import { UserService } from '../services/user/user.service';

export const permissionGuard: CanActivateFn = async (
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

  await permissionService.loadCurrentUserPermissions();

  const requiredPermissions = route.data['permissions'] as string[];

  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  const hasAllPermissions = requiredPermissions.every(permission => {
    const [page, action] = permission.split('.');

    if (!page || !action) {
      console.warn(`Formato de permiso inválido: ${permission}`);
      return false;
    }

    return permissionService.hasPermission(page, action);
  });

  if (!hasAllPermissions) {
    router.navigate(['/unauthorized']);
    return false;
  }

  return true;
};
