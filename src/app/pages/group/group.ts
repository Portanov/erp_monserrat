import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-group',
  imports: [CardModule, ChipModule, ProgressBarModule],
  templateUrl: './group.html',
  styleUrl: './group.css',
})

export class Group {}
