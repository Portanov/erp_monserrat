import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GatewayBaseService } from '../gateway-base/gateway.service';
import {
  Ticket,
  CreateTicketDto,
  UpdateTicketDto,
  ChangeStatusDto,
  AddCommentDto,
  GroupStatsDto,
  Comment,
  TicketStatus,
  Priority
} from '../../models/tickets/ticket.model';

@Injectable({ providedIn: 'root' })
export class TicketsService extends GatewayBaseService {

  // ========== Métodos de utilidad (labels y severities) ==========

  getStatusLabel(status: TicketStatus): string {
    const labels: Record<TicketStatus, string> = {
      pending: 'Pendiente',
      'in-progress': 'En Progreso',
      review: 'Revisión',
      done: 'Hecho',
      blocked: 'Bloqueado'
    };
    return labels[status];
  }

  getPriorityLabel(priority: Priority): string {
    const labels: Record<Priority, string> = {
      alta: 'Alta',
      media: 'Media',
      baja: 'Baja',
      urgente: 'Urgente',
      crítica: 'Crítica',
      normal: 'Normal',
      opcional: 'Opcional'
    };
    return labels[priority];
  }

  getPrioritySeverity(priority: Priority): string {
    const severities: Record<Priority, string> = {
      alta: 'danger',
      urgente: 'danger',
      crítica: 'danger',
      media: 'warning',
      normal: 'info',
      baja: 'success',
      opcional: 'secondary'
    };
    return severities[priority];
  }

  getStatusSeverity(status: TicketStatus): string {
    const severities: Record<TicketStatus, string> = {
      pending: 'warning',
      'in-progress': 'info',
      review: 'help',
      done: 'success',
      blocked: 'danger'
    };
    return severities[status];
  }

  getStatusSeverityColors(status: TicketStatus): string {
    const severities: Record<TicketStatus, string> = {
      pending: 'info',
      'in-progress': 'warn',
      review: 'secondary',
      done: 'success',
      blocked: 'danger'
    };
    return severities[status];
  }

  // ========== Métodos de API ==========

  /**
   * Obtener todos los tickets (sin filtro de grupo)
   */
  getAllTickets(): Observable<Ticket[]> {
    return this.get<Ticket[]>('/tickets');
  }

  /**
   * Obtener ticket por ID
   */
  getTicketById(id: number): Observable<Ticket> {
    return this.get<Ticket>(`/tickets/${id}`);
  }

  /**
   * Obtener tickets por grupo
   */
  getTicketsByGroup(groupId: number): Observable<Ticket[]> {
    return this.get<Ticket[]>(`/tickets/group/${groupId}`);
  }

  /**
   * Obtener estadísticas del grupo
   */
  getGroupStats(groupId: number): Observable<GroupStatsDto> {
    return this.get<GroupStatsDto>(`/tickets/group/${groupId}/stats`);
  }

  /**
   * Obtener tickets de un usuario (asignados o creados por él)
   */
  getUserTickets(userId: number): Observable<Ticket[]> {
    return this.get<Ticket[]>(`/tickets/user/${userId}`);
  }

  /**
   * Obtener tickets asignados a un usuario
   */
  getAssignedTickets(userId: number): Observable<Ticket[]> {
    return this.get<Ticket[]>(`/tickets/user/${userId}/assigned`);
  }

  /**
   * Obtener tickets creados por un usuario
   */
  getCreatedTickets(userId: number): Observable<Ticket[]> {
    return this.get<Ticket[]>(`/tickets/user/${userId}/created`);
  }

  /**
   * Obtener conteo de tickets por grupo
   */
  getTicketCountByGroup(groupId: number): Observable<{ count: number }> {
    return this.get<{ count: number }>(`/tickets/group/${groupId}/count`);
  }

  /**
   * Crear un nuevo ticket
   * Nota: Los headers x-user-id y x-group-id se manejan automáticamente
   * pero necesitas asegurarte de que estén disponibles
   */
  createTicket(dto: CreateTicketDto, userId: number, groupId: number): Observable<Ticket> {
    let data = {
      ...dto,
      createdById: userId,
      groupId: groupId,
    }
    return this.post<Ticket>('/tickets', data, true);
  }

  /**
   * Actualizar ticket completo
   */
  updateTicket(id: number, dto: UpdateTicketDto, userId: number): Observable<Ticket> {
    let data = {
      ...dto,
      userId: userId,
    }
    return this.put<Ticket>(`/tickets/${id}`, data);
  }

  /**
   * Cambiar estado del ticket
   */
  changeTicketStatus(id: number, status: TicketStatus, userId: number): Observable<Ticket> {
    return this.patch<Ticket>(`/tickets/${id}/status`, { status, userId });
  }

  /**
   * Agregar comentario a un ticket
   */
  addComment(ticketId: number, content: string, userId: number): Observable<Comment> {
    return this.post<Comment>(`/tickets/${ticketId}/comments`, { content, userId });
  }

  /**
   * Eliminar ticket
   */
  deleteTicket(id: number): Observable<boolean> {
    return this.delete<boolean>(`/tickets/${id}`);
  }

  // ========== Métodos de utilidad para verificar permisos ==========

  canEditTicket(ticket: Ticket, userId: number): boolean {
    return ticket.createdById === userId;
  }

  canChangeStatus(ticket: Ticket, userId: number): boolean {
    return ticket.assignedToId === userId || ticket.createdById === userId;
  }

  canComment(ticket: Ticket, userId: number): boolean {
    return ticket.assignedToId === userId || ticket.createdById === userId;
  }
}