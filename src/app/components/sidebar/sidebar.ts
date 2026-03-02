import { Component, ViewChild } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { Drawer, DrawerModule } from 'primeng/drawer';
import { RippleModule } from 'primeng/ripple';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [AvatarModule, ButtonModule, DrawerModule, RippleModule, RouterLink],
  template: `
    <div class="card flex justify-center">
      <p-drawer #drawerRef [(visible)]="visible" styleClass="w-80">
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
              <ul class="list-none p-4 m-0">
                @for ( opciones of opciones ; track opciones.label) {
                  <li>
                    <a
                      class="flex items-center cursor-pointer p-4 rounded-border text-surface-700 dark:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-700 duration-150 transition-colors p-ripple"
                      [routerLink]="opciones.routerLink"
                    >
                      <i class="{{opciones.icon}} mr-2"></i>
                      <span class="font-medium">{{opciones.label}}</span>
                    </a>
                  </li>
                }
              </ul>
            </div>
            <div class="mt-auto">
              <hr class="mb-4 mx-4 border-t border-0 border-surface" />
              <p class="m-4 text-xs text-end" >Version 1.0.0</p>
            </div>
          </div>
        </ng-template>
      </p-drawer>
      <p-button (click)="visible = true" icon="pi pi-bars" variant="text" severity="secondary" />
    </div>
  `,
  standalone: true,
})
export class Sidebar {
  @ViewChild('drawerRef') drawerRef!: Drawer;

  visible: boolean = false;

  closeCallback(e: any): void {
    this.drawerRef.close(e);
  }

  opciones = [
    { label: 'Landing', routerLink: '/', icon: 'pi pi-home' },
    { label: 'Home', routerLink: '/group', icon: 'pi pi-chart-bar' },
    { label: 'Profile', routerLink: '/user', icon: 'pi pi-users' },
    { label: 'Login', routerLink: '/login', icon: 'pi pi-sign-in' },
  ];
}
