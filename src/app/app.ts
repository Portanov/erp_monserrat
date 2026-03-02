import { Component, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Alerts } from './components/alerts/alerts';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ButtonModule, Alerts],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App {
  protected readonly title = signal('erp_monserrat');
}
