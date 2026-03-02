import { Component } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { CardModule } from 'primeng/card';
import { ImageModule } from 'primeng/image';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-user',
  imports: [AvatarModule, CardModule, ImageModule, ButtonModule],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class User {

}
