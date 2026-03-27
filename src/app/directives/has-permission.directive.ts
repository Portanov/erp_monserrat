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
  private permissionsArray: string[] = [];

  @Input()
  set appHasPermission(value: string | string[]) {
    if (Array.isArray(value)) {
      this.permissionsArray = value;
      this.updateViewWithOr();
    } else {
      const [page, action] = value.split('.');
      this.page = page;
      this.action = action;
      this.updateView();
    }
  }

  @Input()
  set appHasPermissionAnd(value: string[]) {
    this.permissionsArray = value;
    this.updateViewWithAnd();
  }

  @Input()
  set appHasPermissionOr(value: string[]) {
    this.permissionsArray = value;
    this.updateViewWithOr();
  }

  constructor() {
    effect(() => {
      this.permissionService.currentUserPermissions();

      if (this.page && this.action) {
        this.updateView();
      } else if (this.permissionsArray.length > 0) {
        if (this.appHasPermissionAnd) {
          this.updateViewWithAnd();
        } else {
          this.updateViewWithOr();
        }
      }
    });
  }

  private updateViewWithAnd(): void {
    const hasAllPermissions = this.permissionsArray.every(perm => {
      const [page, action] = perm.split('.');
      return this.permissionService.hasPermission(page, action);
    });

    if (hasAllPermissions) {
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

  private updateViewWithOr(): void {
    const hasAnyPermission = this.permissionsArray.some(perm => {
      const [page, action] = perm.split('.');
      return this.permissionService.hasPermission(page, action);
    });

    if (hasAnyPermission) {
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
