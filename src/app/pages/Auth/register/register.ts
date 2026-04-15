import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { FloatLabelModule } from 'primeng/floatlabel';
import { IftaLabelModule } from 'primeng/iftalabel';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { AlertService } from '../../../services/alerts/alert.service';
import { UserService } from '../../../services/user/user.service';

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
  private alertService = inject(AlertService);
  private userService = inject(UserService);

  model = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    address: '',
    birthday: '',
    phone: '',
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
    return onlyDigits.test(this.model.phone) && this.model.phone.length === 10;
  }

  async onSubmit() {
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
      alert('Teléfono inválido. Solo número y 10 dígitos.');
      return;
    }
    if (!this.model.address) {
      alert('La dirección es requerida');
      return;
    }

    const formattedBirthdate = this.model.birthday.split('T')[0];

    const userData = {
      username: this.model.username,
      email: this.model.email,
      password: this.model.password,
      fullName: this.model.fullName,
      address: this.model.address,
      birthDate: formattedBirthdate,
      phone: this.model.phone
    }

    try {
      const result = await this.userService.register(userData);
      if (result === true) {
        this.model = { username: '', email: '', password: '', confirmPassword: '', fullName: '', address: '', birthday: '', phone: '' };
        this.alertService.success('Éxito', 'Registro exitoso.');
      } else {
        this.alertService.error('Error','Error al registrar usuario. El usuario o email ya existe.');
      }
    } catch (error: any) {
      this.alertService.error('Error',error.message || 'Error al registrar usuario');
    }
  }
}
