import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { FloatLabelModule } from 'primeng/floatlabel';
import { IftaLabelModule } from 'primeng/iftalabel';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-register',
  imports: [
    FormsModule,
    InputTextModule,
    CardModule,
    FloatLabelModule,
    IftaLabelModule,
    ButtonModule,
    MessageModule
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
    address: '',
    birthday: '',
    phone: ''
  };

  passwordsMatch(): boolean {
    return !!this.model.password && this.model.password === this.model.confirmPassword;
  }

  passwordValid(): boolean {
    if (!this.model.password) return false;
    const specialRe = /[!@#$%^&*()_+]/;
    return this.model.password.length >= 10 && specialRe.test(this.model.password);
  }

  isAdult(): boolean {
    if (!this.model.birthday) return false;
    const today = new Date();
    const b = new Date(this.model.birthday);
    let age = today.getFullYear() - b.getFullYear();
    const m = today.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
    return age >= 18;
  }

  phoneValid(): boolean {
    if (!this.model.phone) return false;
    const onlyDigits = /^[0-9]+$/;
    return onlyDigits.test(this.model.phone) && this.model.phone.length >= 7 && this.model.phone.length <= 15;
  }

  onSubmit() {
    if (!this.passwordsMatch()) {
      alert('Las contraseñas no coinciden.');
      return;
    }
    if (!this.passwordValid()) {
      alert('La contraseña debe tener al menos 10 caracteres y un símbolo especial (!@#$%^&*()_+).');
      return;
    }
    if (!this.isAdult()) {
      alert('Debes ser mayor de edad para registrarte.');
      return;
    }
    if (!this.phoneValid()) {
      alert('Teléfono inválido. Solo números, entre 7 y 15 dígitos.');
      return;
    }

    console.log('Registro enviado', this.model);
    alert('Registro enviado correctamente.');
    this.model = { username: '', email: '', password: '', confirmPassword: '', fullName: '', address: '', birthday: '', phone: '' };
  }
}
