import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http'; // <-- PASTI ADA INI

import { IonicModule } from '@ionic/angular';

import { RegistrasiTamuPageRoutingModule } from './registrasi-tamu-routing.module';

import { RegistrasiTamuPage } from './registrasi-tamu.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RegistrasiTamuPageRoutingModule,
    HttpClientModule // <-- PASTI ADA INI
  ],
  declarations: [RegistrasiTamuPage]
})
export class RegistrasiTamuPageModule {}
