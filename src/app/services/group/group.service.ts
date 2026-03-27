import { Injectable } from '@angular/core';
import { UserService } from '../user/user.service';

export interface GroupData {
  id: number,
  name: string,
  categoria: string,
  nivel: string,
  authorId: number,
  members: number[],
  tickets: number
}

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private groups: GroupData[] = [
    { id: 1, name: 'Grupo A', categoria: 'Administrador', nivel: 'Alto', authorId: 1, members: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], tickets: 5 },
    { id: 2, name: 'Grupo B', categoria: 'Categoría 2', nivel: 'Medio', authorId: 1, members: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21], tickets: 10 },
    { id: 3, name: 'Grupo C', categoria: 'Categoría 3', nivel: 'Bajo', authorId: 1, members: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17], tickets: 7 },
  ]
  private nextId = 4;

  constructor(private userService: UserService) { }

  getAll(): GroupData[] {
    return [...this.groups];
  }

  getUserGroups(userId: number): GroupData[] {
    return this.groups.filter(g => g.authorId === userId || g.members.includes(userId));
  }

  addMember(groupId: number, email: string): boolean {
    const group = this.groups.find(g => g.id === groupId);
    const user = this.userService.getByEmail(email);
    if (!group || !user) {
      return false;
    }
    const userId = user.id;
    if (group.members.includes(userId)) {
      return false;
    }
    group.members.push(userId);
    return true;
  }

  removeMember(groupId: number, userId: number): boolean {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) return false;
    const index = group.members.indexOf(userId);
    if (index === -1) return false;
    group.members.splice(index, 1);
    return true;
  }

  create(group: Omit<GroupData, 'id' | 'authorId'>): GroupData {
    const currentUser = this.userService.getCurrentUser();
    const authorId = currentUser?.id || 0;
    const newGroup: GroupData = { ...group, id: this.nextId++, authorId };
    this.groups.push(newGroup);
    return newGroup;
  }

  update(id: number, updated: Partial<GroupData>): boolean {
    const index = this.groups.findIndex(g => g.id === id);
    if (index === -1) return false;
    this.groups[index] = { ...this.groups[index], ...updated };
    return true;
  }

  delete(id: number): boolean {
    const index = this.groups.findIndex(g => g.id === id);
    if (index === -1) return false;
    this.groups.splice(index, 1);
    return true;
  }
}
