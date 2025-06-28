// src/app/pengajuan-form/pengajuan-form.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // Penting: FormsModule & ReactiveFormsModule

import { IonicModule } from '@ionic/angular'; // Penting: IonicModule

import { PengajuanFormPageRoutingModule } from './pengajuan-form-routing.module';

// Penting: WAJIB import PengajuanFormPage jika TIDAK standalone
import { PengajuanFormPage } from './pengajuan-form.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,          // Untuk [(ngModel)]
    ReactiveFormsModule,  // Untuk [formGroup]
    IonicModule,          // Untuk semua komponen 'ion-'
    PengajuanFormPageRoutingModule,
  ],
  // Penting: WAJIB deklarasikan PengajuanFormPage di sini jika TIDAK standalone
  declarations: [PengajuanFormPage]
})
export class PengajuanFormPageModule {}