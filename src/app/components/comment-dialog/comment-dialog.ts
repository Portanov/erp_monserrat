import { Component, Input, Output, EventEmitter, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { TicketsService, Ticket, Comment } from '../../services/tickets/tickets.service';
import { UserService } from '../../services/user/user.service';
import { UserData } from '../../services/user/user.service';
import { BadgeModule } from 'primeng/badge';
import { CardModule } from 'primeng/card';
import { ScrollPanelModule } from 'primeng/scrollpanel';

@Component({
  selector: 'app-comment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    TextareaModule,
    TagModule,
    ProgressSpinnerModule,
    AvatarModule,
    TooltipModule,
    BadgeModule,
    CardModule,
    ScrollPanelModule
  ],
  templateUrl: './comment-dialog.html',
  styleUrls: ['./comment-dialog.css']
})
export class CommentDialogComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() ticketId: string | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() commentAdded = new EventEmitter<Comment>();

  public ticketsService = inject(TicketsService);
  private userService = inject(UserService);

  loading: boolean = false;
  saving: boolean = false;
  submitted: boolean = false;

  ticket: Ticket | null = null;
  comments: Comment[] = [];
  newComment: string = '';

  ngOnInit() {
    // Inicialización
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible'] && this.visible) {
      if (this.ticketId) {
        this.loadTicketAndComments();
      } else {
        this.close();
      }
    }

    if (changes['ticketId'] && this.ticketId && this.visible) {
      this.loadTicketAndComments();
    }
  }

  loadTicketAndComments() {
    if (!this.ticketId) return;

    this.loading = true;

    setTimeout(() => {
      this.ticket = this.ticketsService.getTicketById(this.ticketId!) || null;
      if (this.ticket) {
        this.comments = [...this.ticket.comments].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      this.loading = false;
    }, 300);
  }

  save() {
    this.submitted = true;

    if (!this.newComment?.trim() || !this.ticketId) {
      return;
    }

    this.saving = true;

    setTimeout(() => {
      try {
        const newComment = this.ticketsService.addComment(this.ticketId!, this.newComment.trim());
        this.comments = [newComment, ...this.comments];
        this.newComment = '';
        this.submitted = false;
        this.commentAdded.emit(newComment);
        this.loadTicketAndComments();
      } catch (error) {
        console.error('Error al agregar comentario:', error);
      } finally {
        this.saving = false;
      }
    }, 300);
  }

  getUserById(userId: number): UserData | undefined {
    return this.userService.getById(userId);
  }

  close() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.resetForm();
  }

  onHide() {
    this.close();
  }

  resetForm() {
    this.newComment = '';
    this.submitted = false;
    this.ticket = null;
    this.comments = [];
  }
}
