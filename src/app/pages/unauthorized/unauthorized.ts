import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  template: `
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center p-8 bg-zinc-800 rounded-lg shadow-lg max-w-md">
        <div class="mb-4">
          <i class="pi pi-shield" style="font-size: 7rem"></i>
        </div>
        <h1 class="text-2xl font-bold mb-2">Acceso No Autorizado</h1>
        <p class="text-gray-500 mb-6">
          No tienes permisos suficientes para acceder a esta página.
        </p>
        <div class="flex justify-center">
          <p-button label="Ir al Inicio" icon="pi pi-home" routerLink="/" [rounded]="true" [raised]="true" severity="help" />
        </div>
      </div>
    </div>
  `
})

export class Unauthorized{ }
