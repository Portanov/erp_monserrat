import { Directive, Input, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { PermissionService } from '../services/permissions/permissions.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private permissionService = inject(PermissionService);

  private page: string = '';
  private action: string = '';
  private hasView = false;

  @Input()
  set appHasPermission(value: string) {
    const [page, action] = value.split('.');
    this.page = page;
    this.action = action;
    this.updateView();
  }

  constructor() {
    effect(() => {
      // Reactivity al cambiar permisos
      this.permissionService.currentUserPermissions();
      this.updateView();
    });
  }

  private updateView(): void {
    if (this.permissionService.hasPermission(this.page, this.action)) {
      if (!this.hasView) {
        this.viewContainer.clear();
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      }
    } else {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
