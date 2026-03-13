import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { ProgressBarModule } from 'primeng/progressbar';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { GroupService, GroupData } from '../../services/group/group.service';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';

interface level {
  label: string;
  value: string;
}

@Component({
  selector: 'app-group',
  imports: [CommonModule,
    CardModule,
    ChipModule,
    ProgressBarModule,
    PanelMenuModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    FormsModule,
    InputNumberModule,
    SelectModule],
  templateUrl: './group.html',
  styleUrl: './group.css',
})

export class Group implements OnInit {
  items: MenuItem[] = [];
  groups: GroupData[] = [];
  createVisible: boolean = false;
  editVisible: boolean = false;
  editingGroupId: number | null = null;
  levels: level[] = [];
  selectedlevel: level | null = null;

  newGroup: Omit<GroupData, 'id' | 'autor'> = {
    name: '',
    categoria: '',
    nivel: '',
    miembros: 0,
    tickets: 0
  };

  constructor(private groupService: GroupService) { }

  ngOnInit() {
    this.items = [
      { label: 'Añadir Grupo', icon: 'pi pi-plus', command: () => this.openCreateDialog() },
    ]
    this.loadGroups();
    this.levels = [
      { label: 'Alto', value: 'Alto' },
      { label: 'Medio', value: 'Medio' },
      { label: 'Bajo', value: 'Bajo' }
    ];
  }

  loadGroups() {
    this.groups = this.groupService.getAll();
  }

  openCreateDialog() {
    this.resetForm();
    this.editingGroupId = null;
    this.createVisible = true;
  }

  openEditDialog(group: GroupData) {
    this.editingGroupId = group.id;
    const { id, autor, ...rest } = group;
    this.newGroup = rest;
    this.editVisible = true;
  }

  saveGroup() {
    if (this.editingGroupId === null) {
      this.groupService.create(this.newGroup);
      this.createVisible = false;
    } else {
      this.groupService.update(this.editingGroupId, this.newGroup);
      this.editVisible = false;
    }
    this.loadGroups();
    this.resetForm();
  }

  deleteGroup(id: number) {
    if (confirm('¿Está seguro de que desea eliminar este grupo?')) {
      this.groupService.delete(id);
      this.loadGroups();
    }
  }

  resetForm() {
    this.newGroup = {
      name: '',
      categoria: '',
      nivel: '',
      miembros: 0,
      tickets: 0
    };
  }

  closeDialog() {
    this.createVisible = false;
    this.editVisible = false;
    this.resetForm();
    this.editingGroupId = null;
  }
}

