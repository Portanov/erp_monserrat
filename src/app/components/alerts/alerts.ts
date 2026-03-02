import { Component, inject } from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-alerts',
  imports: [ToastModule],
  template: `
    <p-toast position="bottom-right" />
  `,
  standalone: true
})
export class Alerts {
  messageService = inject(MessageService);
}
