import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProfilSatpamPage } from './profil-satpam.page';

const routes: Routes = [
  {
    path: '',
    component: ProfilSatpamPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProfilSatpamPageRoutingModule {}
