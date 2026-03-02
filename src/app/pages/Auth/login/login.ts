import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { FloatLabelModule } from 'primeng/floatlabel';
import { IftaLabelModule } from 'primeng/iftalabel';
import { ButtonModule } from 'primeng/button';
import { AlertService } from '../../../services/alert.service';
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
  private router = inject(Router);

  model = {
    username: '',
    email: '',
    password: '',
  };

  passwordsMatch(): boolean {
    return this.model.password === "pattern123@";
  }

  emailMatch(): boolean {
    return this.model.email === "pollo@gmail.com";
  }

  onSubmit() {
    if (!this.passwordsMatch() || !this.emailMatch()) {
      this.alertService.error('Error', 'Contraseña o correo incorrectos.');
      return;
    };
    localStorage.setItem('session', 'true');
    this.alertService.success('Éxito', 'Inicio de sesión exitoso.');
    this.router.navigate(['/group']);
  }
}
