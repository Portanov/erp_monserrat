import { Component, OnInit } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { CardModule } from 'primeng/card';
import { ImageModule } from 'primeng/image';
import { ButtonModule } from 'primeng/button';
import { UserService, UserData } from '../../services/user/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [AvatarModule, CardModule, ImageModule, ButtonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})

export class Profile implements OnInit {
  user: UserData | null = null;
  constructor(private userService: UserService, private router: Router) { }

  ngOnInit() {
    this.user = this.userService.getCurrentUser();
  }

  logout() {
    this.userService.logout();
    this.user = null;
    this.router.navigate(['/login']);
  }
}
