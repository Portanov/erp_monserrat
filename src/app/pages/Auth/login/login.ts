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
  selector: 'app-login',
  imports: [
    FormsModule,
    InputTextModule,
    CardModule,
    FloatLabelModule,
    IftaLabelModule,
    ButtonModule,
    MessageModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  model = {
    username: '',
    email: '',
    password: '',
  };

  passwordsMatch(): boolean {
    return !!this.model.password;
  }

  onSubmit() {
    if (!this.passwordsMatch()) return;
    console.log('Sesion iniciada', this.model);
    alert('Sesion iniciada correctamente.');
    this.model = { username: '', email: '', password: '' };
  }
}
