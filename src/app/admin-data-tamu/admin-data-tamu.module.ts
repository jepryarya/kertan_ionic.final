// src/app/admin-data-tamu/admin-data-tamu.module.ts

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'; // <<< PENTING: Diperlukan untuk *ngIf, *ngFor, pipe date
import { FormsModule } from '@angular/forms'; // Diperlukan jika ada formulir di HTML
import { IonicModule } from '@ionic/angular';   // <<< PENTING: Diperlukan untuk komponen Ionic

import { AdminDataTamuPageRoutingModule } from './admin-data-tamu-routing.module';
import { AdminDataTamuPage } from './admin-data-tamu.page';

@NgModule({
  imports: [
    CommonModule, // Pastikan ini ada
    FormsModule,
    IonicModule, // Pastikan ini ada
    AdminDataTamuPageRoutingModule
  ],
  declarations: [AdminDataTamuPage] // Pastikan AdminDataTamuPage dideklarasikan di sini
})
export class AdminDataTamuPageModule {}