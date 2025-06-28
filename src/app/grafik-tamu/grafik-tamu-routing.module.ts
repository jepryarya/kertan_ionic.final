import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GrafikTamuPage } from './grafik-tamu.page';

const routes: Routes = [
  {
    path: '',
    component: GrafikTamuPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GrafikTamuPageRoutingModule {}
