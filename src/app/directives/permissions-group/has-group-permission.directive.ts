// directives/has-group-permission.directive.ts
import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect, OnDestroy } from '@angular/core';
import { GroupPermissionService } from '../../services/group_permissions/group-permissions.service';

@Directive({
  selector: '[appHasGroupPermission]',
  standalone: true
})
export class HasGroupPermissionDirective {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private groupPermissionService = inject(GroupPermissionService);

  private groupId: number = 0;
  private permission: string = '';
  private permissions: string[] = [];
  private mode: 'all' | 'any' = 'any';
  private hasView = false;

  @Input() set appHasGroupPermission(value: { groupId: number; permission: string } | { groupId: number; permissions: string[]; mode?: 'all' | 'any' }) {
    if ('permission' in value) {
      this.groupId = value.groupId;
      this.permission = value.permission;
      this.permissions = [];
      this.mode = 'any';
      this.updateView();
    } else if ('permissions' in value) {
      this.groupId = value.groupId;
      this.permissions = value.permissions;
      this.permission = '';
      this.mode = value.mode || 'any';
      this.updateView();
    }
  }

  @Input() set appHasGroupPermissionAnd(value: { groupId: number; permissions: string[] }) {
    this.groupId = value.groupId;
    this.permissions = value.permissions;
    this.permission = '';
    this.mode = 'all';
    this.updateView();
  }

  @Input() set appHasGroupPermissionOr(value: { groupId: number; permissions: string[] }) {
    this.groupId = value.groupId;
    this.permissions = value.permissions;
    this.permission = '';
    this.mode = 'any';
    this.updateView();
  }

  constructor() {
    effect(() => {
      this.groupPermissionService.getGroupPermissions(this.groupId);
      if (this.groupId && (this.permission || this.permissions.length > 0)) {
        this.updateView();
      }
    });
  }

  private async updateView(): Promise<void> {
    let hasPermission = false;

    try {
      if (this.permission) {
        hasPermission = await this.groupPermissionService.hasGroupPermission(this.groupId, this.permission);
      } else if (this.permissions.length > 0) {
        if (this.mode === 'all') {
          hasPermission = await this.groupPermissionService.hasAllGroupPermissions(this.groupId, this.permissions);
        } else {
          hasPermission = await this.groupPermissionService.hasAnyGroupPermission(this.groupId, this.permissions);
        }
      }
    } catch (error) {
      console.error('Error checking permission:', error);
      hasPermission = false;
    }

    if (hasPermission) {
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
