// src/app/grafik-tamu/grafik-tamu.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Penting: Untuk [(ngModel)]

import { IonicModule } from '@ionic/angular'; // Penting: Untuk komponen Ionic

import { GrafikTamuPageRoutingModule } from './grafik-tamu-routing.module';

import { GrafikTamuPage } from './grafik-tamu.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,        // Pastikan ini ada
    IonicModule,        // Pastikan ini ada
    GrafikTamuPageRoutingModule
  ],
  declarations: [GrafikTamuPage]
})
export class GrafikTamuPageModule {}