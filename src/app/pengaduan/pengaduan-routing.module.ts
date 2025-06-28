import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PengaduanPage } from './pengaduan.page';

const routes: Routes = [
  {
    path: '',
    component: PengaduanPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PengaduanPageRoutingModule {}
