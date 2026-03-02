import { Component } from '@angular/core';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-header',
  imports: [MenubarModule, Sidebar],
  template: `
    <div class="card fixed top-0 z-50 w-full" >
      <p-menubar>
        <ng-template #start>
          Erp Monserrat
        </ng-template>
        <app-sidebar></app-sidebar>
      </p-menubar>
    </div>
  `,
  standalone: true,
  styleUrl: './header.css'
})
export class Header {
  items: MenuItem[] | undefined;
  ngOnInit() {
    this.items = [
      { label: 'Home', routerLink: '/' },
      { label: 'Login', routerLink: '/login' },
      { label: 'Register', routerLink: '/register' },
    ];
  }
}
