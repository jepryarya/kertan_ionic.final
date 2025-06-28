// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http'; // Penting: HttpClientModule dan HTTP_INTERCEPTORS

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { TokenInterceptor } from './interceptors/token.interceptor'; // Penting: Import TokenInterceptor Anda

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule, // Pastikan ini ada
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    // Penting: Daftarkan TokenInterceptor di sini
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true // multi: true penting karena Anda bisa memiliki lebih dari satu interceptor
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}