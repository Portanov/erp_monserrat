# Sistema de Permisos - Guía de Uso

## 1. Directive `*ngHasPermission` - Bloquear Funciones

Usa este directive para mostrar/ocultar elementos en tus templates basado en permisos.

### Sintaxis
```html
<button *appHasPermission="'page.action'">
  Realizar acción
</button>
```

### Ejemplos de uso en componentes

#### Página de Grupos
```typescript
// En group.html
<div>
  <h2>Gestión de Gruppios</h2>
  
  <!-- Botón crear solo visible si tiene permiso -->
  <button *appHasPermission="'group.create'" (click)="createGroup()">
    Crear Grupo
  </button>

  <!-- Tabla con acciones condicionales -->
  <table>
    <tbody>
      <tr *ngFor="let group of groups">
        <td>{{ group.name }}</td>
        <td>
          <button *appHasPermission="'group.edit'" (click)="editGroup(group)">
            Editar
          </button>
          <button *appHasPermission="'group.delete'" (click)="deleteGroup(group)">
            Eliminar
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

#### Página de Usuarios
```typescript
// En user.html
<div>
  <h2>Gestión de Usuarios</h2>
  
  <button *appHasPermission="'users.create'" (click)="createUser()">
    Nuevo Usuario
  </button>

  <div *ngFor="let user of users">
    <p>{{ user.name }}</p>
    <button *appHasPermission="'users.edit'" (click)="editUser(user)">
      Editar
    </button>
    <button *appHasPermission="'users.delete'" (click)="deleteUser(user)">
      Eliminar
    </button>
    <button *appHasPermission="'users.view'" (click)="viewDetails(user)">
      Ver Detalles
    </button>
  </div>
</div>
```

## 2. Guard `permissionGuard` - Proteger Rutas

Usa este guard para proteger rutas basado en permisos.

### Configurar en app.routes.ts

```typescript
import { Routes } from '@angular/router';
import { permissionGuard } from './guards/permission.guard';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', loadComponent: () => import('./pages/landingpage/landingpage').then(m => m.Landingpage) },
      { 
        path: 'group', 
        loadComponent: () => import('./pages/group/group').then(m => m.Group),
        canActivate: [permissionGuard],
        data: { permissions: ['group.view'] }
      },
      { 
        path: 'user', 
        loadComponent: () => import('./pages/user/user').then(m => m.User),
        canActivate: [permissionGuard],
        data: { permissions: ['users.view'] }
      },
      { 
        path: 'profile', 
        loadComponent: () => import('./pages/profile/profile').then(m => m.Profile),
        canActivate: [authGuard]
      },
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
    canActivate: [authGuard],
    children: [
      // Tus rutas admin aquí
    ]
  }
];
```

## 3. Guard `authGuard` - Autenticación

Usa este guard para rutas que requieren estar autenticado.

```typescript
// Ya configurado como se muestra arriba
canActivate: [authGuard]
```

## 4. Permisos Disponibles en el Sistema

### Por defecto están configurados:

**Usuario ID 1 (Admin):**
- group: view, create, edit, delete ✅
- users: view, create, edit, delete ✅
- profile: view, create, edit, delete ✅

**Usuario ID 2 (Usuario regular):**
- group: view ✅ (solo ver)
- users: ----- (sin acceso)
- profile: view ✅ (solo ver su perfil)

## 5. Modificar Permisos en Tiempo de Ejecución

En cualquier componente puedes modificar permisos:

```typescript
import { PermissionService } from '../../services/permissions/permissions.service';

export class MyComponent {
  constructor(private permissionService: PermissionService) {}

  // Asignar permisos a un usuario
  assignPermissions() {
    this.permissionService.assignPermissions(2, 'group', {
      view: true,
      create: true,
      edit: false,
      delete: false
    });
  }

  // Actualizar permisos
  updatePermissions() {
    this.permissionService.updatePermissions(2, 'users', {
      view: true
    });
  }

  // Obtener permisos del usuario actual
  getCurrentUserPerms() {
    const perms = this.permissionService.currentUserPermissions();
    console.log(perms);
  }

  // Copiar permisos de un usuario a otro
  copyPerms() {
    this.permissionService.copyPermissions(1, 2); // Copiar permisos del usuario 1 al 2
  }

  // Remover permisos de una página
  removePerms() {
    this.permissionService.removePermissions(2, 'group');
  }
}
```

## 6. Importar el Directive en tus Componentes

Para usar `*ngHasPermission`, importa el directive en tus componentes:

```typescript
import { HasPermissionDirective } from '../../directives/has-permission.directive';

@Component({
  selector: 'app-my-component',
  imports: [
    CommonModule,
    HasPermissionDirective, // ← Agregar aquí
  ],
  template: `
    <button *appHasPermission="'group.create'">Crear</button>
  `
})
export class MyComponent {}
```

## Resumen del Flujo

1. **Sidebar** → Filtra rutas según permisos del usuario
2. **Guards** → Protegen las rutas para que solo usuarios autenticados y con permisos accedan
3. **Directive** → Muestra/oculta botones y funciones basado en permisos
4. **PermissionService** → Gestiona todos los permisos del sistema
