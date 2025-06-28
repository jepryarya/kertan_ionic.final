import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ProfilRtPageRoutingModule } from './profil-rt-routing.module';

import { ProfilRtPage } from './profil-rt.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ProfilRtPageRoutingModule
  ],
  declarations: [ProfilRtPage]
})
export class ProfilRtPageModule {}
