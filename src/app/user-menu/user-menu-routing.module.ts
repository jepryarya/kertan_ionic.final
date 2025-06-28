import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UserMenuPage } from './user-menu.page';

const routes: Routes = [
  {
    path: '',
    component: UserMenuPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserMenuPageRoutingModule {}
