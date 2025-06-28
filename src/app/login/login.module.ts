    import { NgModule } from '@angular/core';
    import { CommonModule } from '@angular/common';
    import { FormsModule, ReactiveFormsModule } from '@angular/forms';

    import { IonicModule } from '@ionic/angular';

    import { LoginPageRoutingModule } from './login-routing.module';

    import { LoginPage } from './login.page'; // Pastikan ini diimpor

    @NgModule({
      imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        IonicModule,
        LoginPageRoutingModule
      ],
      declarations: [LoginPage] // LoginPage dideklarasikan di sini
    })
    export class LoginPageModule {}
    