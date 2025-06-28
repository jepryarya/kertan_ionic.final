import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ProfilSatpamPageRoutingModule } from './profil-satpam-routing.module';

import { ProfilSatpamPage } from './profil-satpam.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ProfilSatpamPageRoutingModule
  ],
  declarations: [ProfilSatpamPage]
})
export class ProfilSatpamPageModule {}
