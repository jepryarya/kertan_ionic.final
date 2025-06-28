import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RegistrasiTamuPage } from './registrasi-tamu.page';

const routes: Routes = [
  {
    path: '',
    component: RegistrasiTamuPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegistrasiTamuPageRoutingModule {}
