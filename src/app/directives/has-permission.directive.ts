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

  private page = '';
  private action = '';
  private permissionsArray: string[] = [];
  private mode: 'single' | 'and' | 'or' = 'single';
  private hasView = false;

  @Input()
  set appHasPermission(value: string | string[]) {
    if (Array.isArray(value)) {
      this.permissionsArray = value;
      this.page = '';
      this.action = '';
      this.mode = 'or';
    } else {
      const parsed = this.parsePermission(value);
      this.page = parsed?.page ?? '';
      this.action = parsed?.action ?? '';
      this.permissionsArray = [];
      this.mode = 'single';
    }

    void this.updateView();
  }

  @Input()
  set appHasPermissionAnd(value: string[]) {
    this.permissionsArray = value;
    this.page = '';
    this.action = '';
    this.mode = 'and';
    void this.updateView();
  }

  @Input()
  set appHasPermissionOr(value: string[]) {
    this.permissionsArray = value;
    this.page = '';
    this.action = '';
    this.mode = 'or';
    void this.updateView();
  }

  constructor() {
    effect(() => {
      this.permissionService.currentUserPermissions();

      if (this.page || this.permissionsArray.length > 0) {
        void this.updateView();
      }
    });
  }

  private async updateView(): Promise<void> {
    await this.permissionService.loadCurrentUserPermissions();

    const canRender = this.canRenderContent();

    if (canRender) {
      if (!this.hasView) {
        this.viewContainer.clear();
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      }
      return;
    }

    this.viewContainer.clear();
    this.hasView = false;
  }

  private canRenderContent(): boolean {
    if (this.mode === 'single') {
      return this.permissionService.hasPermission(this.page, this.action);
    }

    const permissions = this.permissionsArray
      .map(permission => this.parsePermission(permission))
      .filter((permission): permission is { page: string; action: string } => Boolean(permission));

    if (permissions.length === 0) {
      return false;
    }

    if (this.mode === 'and') {
      return permissions.every(permission => this.permissionService.hasPermission(permission.page, permission.action));
    }

    return permissions.some(permission => this.permissionService.hasPermission(permission.page, permission.action));
  }

  private parsePermission(value: string): { page: string; action: string } | null {
    const [page, ...actionParts] = value.split('.');
    const action = actionParts.join('.');

    if (!page || !action) {
      return null;
    }

    return {
      page: page.trim(),
      action: action.trim()
    };
  }
}
