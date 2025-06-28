import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminDataTamuPage } from './admin-data-tamu.page';

const routes: Routes = [
  {
    path: '',
    component: AdminDataTamuPage
  }
  
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminDataTamuPageRoutingModule {}
