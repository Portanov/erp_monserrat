import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { FloatLabelModule } from 'primeng/floatlabel';
import { IftaLabelModule } from 'primeng/iftalabel';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-register',
  imports: [
    FormsModule,
    InputTextModule,
    CardModule,
    FloatLabelModule,
    IftaLabelModule,
    ButtonModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  model = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    address: ''
  };

  passwordsMatch(): boolean {
    return !!this.model.password && this.model.password === this.model.confirmPassword;
  }

  onSubmit() {
    if (!this.passwordsMatch()) return;
    // Aquí normalmente llamarías a un servicio para registrar al usuario.
    console.log('Registro enviado', this.model);
    alert('Registro enviado correctamente.');
    this.model = { username: '', email: '', password: '', confirmPassword: '', fullName: '', address: '' };
  }
}
