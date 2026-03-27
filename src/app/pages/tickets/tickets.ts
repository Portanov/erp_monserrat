import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { Kanban } from '../../components/kanban/kanban';

@Component({
  selector: 'app-tickets',
  imports: [
    FormsModule,
    ToggleButtonModule,
    Kanban
  ],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css',
})
export class Tickets {

}
