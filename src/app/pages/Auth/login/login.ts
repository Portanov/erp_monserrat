import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { FloatLabelModule } from 'primeng/floatlabel';
import { IftaLabelModule } from 'primeng/iftalabel';
import { ButtonModule } from 'primeng/button';
import { AlertService } from '../../../services/alerts/alert.service';
import { UserService } from '../../../services/user/user.service';
import { MessageModule } from 'primeng/message';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    InputTextModule,
    CardModule,
    FloatLabelModule,
    IftaLabelModule,
    ButtonModule,
    MessageModule,
    RouterLink
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private alertService = inject(AlertService);
  private userService = inject(UserService);
  private router = inject(Router);

  model = {
    identifier: '',
    password: '',
  };

  onSubmit() {
    if (!this.model.identifier || !this.model.password) {
      this.alertService.error('Error', 'Por favor completa todos los campos.');
      return;
    }

    const loginSuccess = this.userService.login(this.model.identifier, this.model.password);

    if (!loginSuccess) {
      this.alertService.error('Error', 'Usuario o contraseña incorrectos.');
      return;
    }

    localStorage.setItem('session', 'true');
    this.alertService.success('Éxito', 'Inicio de sesión exitoso.');
    this.router.navigate(['/group']);
  }
}
