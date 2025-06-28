import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '', // Ini adalah rute default (ketika aplikasi diakses di '/')
    redirectTo: 'login', // Mengarahkan ke halaman 'login' secara default
    pathMatch: 'full' // Penting: memastikan seluruh path kosong cocok
  },
  {
    path: 'login', // Rute untuk halaman login
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'admin-menu', // Rute untuk halaman menu admin
    loadChildren: () => import('./admin-menu/admin-menu.module').then( m => m.AdminMenuPageModule)
  },
  {
    path: 'user-menu', // Rute untuk halaman menu user
    loadChildren: () => import('./user-menu/user-menu.module').then( m => m.UserMenuPageModule)
  },
  {
    path: 'user-profile', // Rute untuk halaman profil user
    loadChildren: () => import('./user-profile/user-profile.module').then( m => m.UserProfilePageModule)
  },
  {
    path: 'registrasi-tamu', // Rute untuk halaman registrasi tamu
    loadChildren: () => import('./registrasi-tamu/registrasi-tamu.module').then( m => m.RegistrasiTamuPageModule)
  },
  {
    path: 'admin-data-tamu', // Rute untuk halaman daftar tamu admin
    loadChildren: () => import('./admin-data-tamu/admin-data-tamu.module').then( m => m.AdminDataTamuPageModule)
  },
  {
    path: 'grafik-tamu',
    loadChildren: () => import('./grafik-tamu/grafik-tamu.module').then( m => m.GrafikTamuPageModule)
  },
    {
    path: 'grafik-tamu', // <--- Rute untuk halaman laporan tamu
    // Menggunakan loadChildren untuk memuat modul, bukan loadComponent
    loadChildren: () => import('./grafik-tamu/grafik-tamu.module').then( m => m.GrafikTamuPageModule)
  },
  {
    path: 'pengajuan-form',
    loadChildren: () => import('./pengajuan-form/pengajuan-form.module').then( m => m.PengajuanFormPageModule)
  },
  {
    path: 'pengaduan',
    loadChildren: () => import('./pengaduan/pengaduan.module').then( m => m.PengaduanPageModule)
  },
  {
    path: 'profil-rt',
    loadChildren: () => import('./profil-rt/profil-rt.module').then( m => m.ProfilRtPageModule)
  },
  {
    path: 'profil-satpam',
    loadChildren: () => import('./profil-satpam/profil-satpam.module').then( m => m.ProfilSatpamPageModule)
  },
  // Rute 'edit-data-tamu' yang terpisah tidak diperlukan di sini
  // karena sudah diatur sebagai rute anak di 'admin-data-tamu-routing.module.ts'
  // dengan path 'edit/:id'.
  // Ini berarti halaman edit akan diakses melalui '/admin-data-tamu/edit/:id'.
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
