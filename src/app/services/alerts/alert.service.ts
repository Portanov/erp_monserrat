import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private messageService = inject(MessageService);

  success(summary: string, detail?: string) {
    this.messageService.add({ severity: 'success', summary, detail: detail || '' });
  }

  error(summary: string, detail?: string) {
    this.messageService.add({ severity: 'error', summary, detail: detail || '' });
  }

  warn(summary: string, detail?: string) {
    this.messageService.add({ severity: 'warn', summary, detail: detail || '' });
  }

  info(summary: string, detail?: string) {
    this.messageService.add({ severity: 'info', summary, detail: detail || '' });
  }
}
