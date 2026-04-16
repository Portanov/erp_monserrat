import { inject, Injectable } from '@angular/core';
import { UserService } from '../user/user.service';
import { User } from '../../models/user/user.model';
import { GatewayBaseService } from '../gateway-base/gateway.service';
import { CreateGroupDto, GroupData, GroupResponseDto, UpdateGroupDto } from '../../models/groups/groups.model';
import { firstValueFrom } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class GroupService extends GatewayBaseService {
  private userService = inject(UserService);

  private groupsCache: GroupData[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 30000;

  /**
   * Obtiene todos los grupos
   */
  async getAll(): Promise<GroupData[]> {
    if (this.groupsCache && (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION) {
      return [...this.groupsCache];
    }

    try {
      const response = await firstValueFrom(this.get<GroupResponseDto[]>('/groups'));
      const groups = this.mapToGroupDataArray(response);
      this.groupsCache = groups;
      this.cacheTimestamp = Date.now();
      return groups;
    } catch (error) {
      console.error('Error fetching groups:', error);
      return [];
    }
  }

  /**
   * Obtiene un grupo por ID
   */
  async getById(id: number): Promise<GroupData | null> {
    try {
      if (this.groupsCache) {
        const cached = this.groupsCache.find(g => g.id === id);
        if (cached) return cached;
      }

      const response = await firstValueFrom(this.get<GroupResponseDto>(`/groups/${id}`));
      return this.mapToGroupData(response);
    } catch (error) {
      console.error(`Error fetching group ${id}:`, error);
      return null;
    }
  }

  /**
   * Obtiene los grupos de un usuario
   */
  async getUserGroups(userId: number): Promise<GroupData[]> {
    try {
      const response = await firstValueFrom(this.get<GroupResponseDto[]>(`/groups/user/${userId}`));
      return this.mapToGroupDataArray(response);
    } catch (error) {
      console.error(`Error fetching user groups for ${userId}:`, error);
      return [];
    }
  }

  /**
   * Crea un nuevo grupo
   */
  async create(group: CreateGroupDto): Promise<GroupData | null> {
    try {
      const currentUser = this.userService.getCurrentUser();
      if (!currentUser) throw new Error('Usuario no autenticado');

      const response = await firstValueFrom(this.post<GroupResponseDto>('/groups', group));

      this.invalidateCache();

      return this.mapToGroupData(response);
    } catch (error) {
      console.error('Error creating group:', error);
      return null;
    }
  }

  /**
   * Actualiza un grupo
   */
  async update(id: number, updated: UpdateGroupDto): Promise<GroupData | null> {
    try {
      const response = await firstValueFrom(this.put<GroupResponseDto>(`/groups/${id}`, updated));

      this.invalidateCache();

      return this.mapToGroupData(response);
    } catch (error) {
      console.error(`Error updating group ${id}:`, error);
      return null;
    }
  }

  /**
   * Elimina un grupo
   */
  async deleteGroup(id: number): Promise<boolean> {
    try {
      await firstValueFrom(this.delete<void>(`/groups/${id}`));

      this.invalidateCache();

      return true;
    } catch (error) {
      console.error(`Error deleting group ${id}:`, error);
      return false;
    }
  }

  /**
   * Añade un miembro al grupo
   */
  async addMember(groupId: number, email: string): Promise<boolean> {
    try {
      await firstValueFrom(this.post<void>(`/groups/${groupId}/members`, { email }));

      this.invalidateCache();

      return true;
    } catch (error) {
      console.error(`Error adding member to group ${groupId}:`, error);
      return false;
    }
  }

  /**
   * Elimina un miembro del grupo
   */
  async removeMember(groupId: number, userId: number): Promise<boolean> {
    try {
      await firstValueFrom(this.delete<void>(`/groups/${groupId}/members/${userId}`));

      this.invalidateCache();

      return true;
    } catch (error) {
      console.error(`Error removing member from group ${groupId}:`, error);
      return false;
    }
  }

  /**
   * Verifica si un usuario es miembro de un grupo
   */
  async isMember(userId: number, groupId: number): Promise<boolean> {
    try {
      const group = await this.getById(groupId);
      return group?.members.includes(userId) || false;
    } catch (error) {
      console.error(`Error checking membership:`, error);
      return false;
    }
  }

  /**
   * Verifica si un usuario es autor de un grupo
   */
  async isAuthor(userId: number, groupId: number): Promise<boolean> {
    try {
      const group = await this.getById(groupId);
      return group?.authorId === userId;
    } catch (error) {
      console.error(`Error checking author:`, error);
      return false;
    }
  }

  /**
   * Invalida la caché de grupos
   */
  private invalidateCache(): void {
    this.groupsCache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Mapea la respuesta del backend al formato GroupData
   */
  private mapToGroupData(response: GroupResponseDto): GroupData {
    return {
      id: response.id,
      name: response.name,
      category: response.category,
      level: response.level,
      authorId: response.authorId,
      members: response.members,
      ticketCount: response.ticketCount,
      createdAt: response.createdAt
    };
  }

  /**
   * Mapea un array de respuestas
   */
  private mapToGroupDataArray(responses: GroupResponseDto[]): GroupData[] {
    return responses.map(r => this.mapToGroupData(r));
  }
}
