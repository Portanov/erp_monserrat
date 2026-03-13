import { Component, ViewChild, OnInit } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { Drawer, DrawerModule } from 'primeng/drawer';
import { RippleModule } from 'primeng/ripple';
import { UserService } from '../../services/user/user.service';
import { PermissionService } from '../../services/permissions/permissions.service';
import { PanelMenuModule } from 'primeng/panelmenu';

@Component({
  selector: 'app-sidebar',
  imports: [
    AvatarModule,
    ButtonModule,
    DrawerModule,
    RippleModule,
    PanelMenuModule
  ],
  template: `
    <div class="card flex justify-center">
      <p-drawer #drawerRef [(visible)]="visible" styleClass="w-80"
      appendTo="body"
      [modal]="true"
      position="right"
      (onShow)="onDrawerShow()"
      >
        <ng-template #headless>
          <div class="flex flex-col h-full">
            <div class="flex items-center justify-between px-6 pt-4 shrink-0">
              <span class="inline-flex items-center gap-2">
                <span class="font-semibold text-2xl text-primary">Erp Monserrat</span>
              </span>
              <span>
                <p-button
                  type="button"
                  (click)="closeCallback($event)"
                  icon="pi pi-times"
                  rounded="true"
                  outlined="true"
                  styleClass="h-8 w-8"
                  variant="text"
                ></p-button>
              </span>
            </div>
            <div class="overflow-y-auto">
              <ul class="list-none p-6 m-0">
                <p-panelmenu [model]="opciones" />
              </ul>
            </div>
            <div class="mt-auto">
              <hr class="mb-4 mx-4 border-t border-0 border-surface" />
              <p class="m-4 text-xs text-end" >Version 1.0.0</p>
            </div>
          </div>
        </ng-template>
      </p-drawer>
      <p-button (click)="toggleDrawer()" icon="pi pi-bars" variant="text" severity="secondary" />
    </div>
  `,
  standalone: true,
})

export class Sidebar implements OnInit {
  @ViewChild('drawerRef') drawerRef!: Drawer;
  visible: boolean = false;
  opciones: any[] = [];

  constructor(
    private userService: UserService,
    private permissionService: PermissionService
  ) { }

  ngOnInit(): void {
    this.actualizarMenu();
  }

  toggleDrawer(): void {
    this.visible = true;
    this.actualizarMenu();
  }

  onDrawerShow(): void {
    this.actualizarMenu();
  }

  actualizarMenu(): void {
    const auth = this.userService.isAuthenticated();

    const rutasUniversales = [
      { label: 'Landing', routerLink: '/', icon: 'pi pi-home', visible: true },
    ];

    const rutasProtegidas = [
      { label: 'Group', routerLink: '/group', icon: 'pi pi-chart-bar', page: 'group' },
      { label: 'User', routerLink: '/user', icon: 'pi pi-users', page: 'users' },
    ];

    const rutaPerfil = [
      { label: 'Profile', routerLink: '/profile', icon: 'pi pi-user', visible: auth },
    ];

    const rutaLogin = [
      { label: 'Login', routerLink: '/login', icon: 'pi pi-sign-in', visible: !auth },
    ];

    const rutaCierreSesion = [
      { label: 'Cerrar sesión', icon: 'pi pi-sign-out', command: () => this.logout(), visible: auth },
    ];

    const rutasProtegidasFiltradas = rutasProtegidas
      .filter(ruta => this.permissionService.hasPermission(ruta.page, 'view'))
      .map(({ page, ...rest }) => ({ ...rest, visible: true }));

    this.opciones = [
      ...rutasUniversales,
      ...rutasProtegidasFiltradas,
      ...rutaPerfil,
      ...rutaLogin,
      ...rutaCierreSesion,
    ].filter(opcion => opcion.visible);
  }

  closeCallback(e: any): void {
    this.drawerRef.close(e);
  }

  onOptionClick(option: any): void {
    if (option && option.command && typeof option.command === 'function') {
      option.command();
    }
  }

  logout(): void {
    this.userService.logout();
    this.actualizarMenu();
    this.closeCallback(new Event('click'));
  }
}
