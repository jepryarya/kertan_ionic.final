// src/app/pengajuan-form/pengajuan-form-routing.module.ts
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PengajuanFormPage } from './pengajuan-form.page';

const routes: Routes = [
  {
    path: '', // Ini berarti komponen PengajuanFormPage akan ditampilkan ketika rute '/pengajuan-form' diakses
    component: PengajuanFormPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PengajuanFormPageRoutingModule {}