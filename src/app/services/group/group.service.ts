import { Injectable } from '@angular/core';
import { UserService } from '../user/user.service';

export interface GroupData {
  id: number,
  name: string,
  categoria: string,
  nivel: string,
  autor: string,
  miembros: number,
  tickets: number
}

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  private groups: GroupData[] = [
    { id: 1, name: 'Grupo A', categoria: 'Administrador', nivel: 'Alto', autor: 'Autor 1', miembros: 10, tickets: 5 },
    { id: 2, name: 'Grupo B', categoria: 'Categoría 2', nivel: 'Medio', autor: 'Autor 2', miembros: 20, tickets: 10 },
    { id: 3, name: 'Grupo C', categoria: 'Categoría 3', nivel: 'Bajo', autor: 'Autor 3', miembros: 15, tickets: 7 },
  ]
  private nextId = 4;

  constructor(private userService: UserService) { }

  getAll(): GroupData[] {
    return [...this.groups];
  }

  create(group: Omit<GroupData, 'id' | 'autor'>): GroupData {
    const currentUser = this.userService.getCurrentUser();
    const autor = currentUser?.username || 'Sistema';
    const newGroup: GroupData = { ...group, id: this.nextId++, autor };
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
