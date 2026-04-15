// comment-dialog.ts
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
import { User } from '../../models/user/user.model';
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

  usersMap: Map<number, User> = new Map();
  commentsWithUsers: { comment: Comment; user: User | null }[] = [];

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

  async loadTicketAndComments() {
    if (!this.ticketId) return;

    this.loading = true;

    setTimeout(async () => {
      this.ticket = this.ticketsService.getTicketById(this.ticketId!) || null;
      if (this.ticket) {
        this.comments = [...this.ticket.comments].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        await this.loadUsersForComments();
      }
      this.loading = false;
    }, 300);
  }

  private async loadUsersForComments() {
    const userIds = [...new Set(this.comments.map(c => c.userId))];

    for (const userId of userIds) {
      if (!this.usersMap.has(userId)) {
        const user = await this.userService.getById(userId);
        if (user) {
          this.usersMap.set(userId, user);
        }
      }
    }

    this.commentsWithUsers = this.comments.map(comment => ({
      comment,
      user: this.usersMap.get(comment.userId) || null
    }));
  }

  async save() {
    this.submitted = true;

    if (!this.newComment?.trim() || !this.ticketId) {
      return;
    }

    this.saving = true;

    setTimeout(async () => {
      try {
        const newComment = this.ticketsService.addComment(this.ticketId!, this.newComment.trim());

        if (!this.usersMap.has(newComment.userId)) {
          const user = await this.userService.getById(newComment.userId);
          if (user) {
            this.usersMap.set(newComment.userId, user);
          }
        }

        this.commentsWithUsers = [
          { comment: newComment, user: this.usersMap.get(newComment.userId) || null },
          ...this.commentsWithUsers
        ];

        this.comments = [newComment, ...this.comments];
        this.newComment = '';
        this.submitted = false;
        this.commentAdded.emit(newComment);
      } catch (error) {
        console.error('Error al agregar comentario:', error);
      } finally {
        this.saving = false;
      }
    }, 300);
  }

  // 🔥 ELIMINAR este método ya no lo necesitas
  // async getUserById(userId: number): Promise<User | null> {
  //   return await this.userService.getById(userId);
  // }

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
    this.commentsWithUsers = [];
    this.usersMap.clear();
  }
}