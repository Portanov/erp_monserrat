import { Component } from '@angular/core';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-header',
  imports: [MenubarModule],
  template: `
    <div class="card">
        <p-menubar [model]="items" />
    </div>
  `,
})
export class Header {
  items: MenuItem[] | undefined;
  ngOnInit() {
    this.items = [
      { label: 'Home', routerLink: '/'},
      { label: 'Login', routerLink: '/login'},
      { label: 'Register', routerLink: '/register'}
    ]
  }

}
