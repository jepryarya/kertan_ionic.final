// File: src/app/user-profile/user-profile.page.ts

import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Import HttpClient untuk melakukan panggilan API
import { environment } from 'src/environments/environment'; // Asumsi ada file environment.ts untuk URL API
import { AuthService } from '../services/auth.service'; // Import AuthService

// Interface untuk model Warga agar TypeScript lebih aman
interface Warga {
  id: number;
  nama: string;
  nik: string;
  kk: string;
  alamat_rumah: string;
  no_rumah: string;
  no_hp: string;
  akun_user_id: number;
  foto_rumah?: string; // Tanda tanya berarti properti ini opsional
  jumlah_anggota_keluarga?: number;
  created_at: string;
  updated_at: string;
}

@Component({
  standalone: false,
  selector: 'app-user-profile',
  templateUrl: './user-profile.page.html',
  styleUrls: ['./user-profile.page.scss'],
})
export class UserProfilePage implements OnInit {

  // Properti untuk menyimpan data warga yang diambil dari API
  warga: Warga | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;

  // Injeksi HttpClient dan AuthService di constructor
  constructor(private http: HttpClient, private authService: AuthService) { }

  ngOnInit() {
    // Panggil metode untuk mengambil profil warga saat komponen diinisialisasi
    this.getWargaProfile();
  }

  /**
   * Mengambil data profil warga dari API Laravel.
   * Menggunakan endpoint GET /api/profile-warga.
   */
  async getWargaProfile() { // Tambahkan async karena akan menggunakan await
    this.isLoading = true;
    this.errorMessage = null;

    // Mendapatkan token autentikasi dari AuthService
    const authToken = await this.authService.getToken();

    if (!authToken) {
      this.errorMessage = 'Token autentikasi tidak ditemukan. Harap login.';
      this.isLoading = false;
      console.error('Authentication token not found.');
      return;
    }

    // Menyiapkan header HTTP dengan token Bearer
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    });

    // Melakukan panggilan HTTP GET ke endpoint profil warga
    // Mengubah endpoint dari '/warga/profile' menjadi '/profile-warga'
    const apiUrl = `${environment.apiUrl}/warga-profile`; // <-- Perubahan di sini!

    this.http.get<any>(apiUrl, { headers }).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.warga = response.data; // Simpan data warga yang diterima
          console.log('Data warga berhasil dimuat:', this.warga);
          // Tambahkan console.log ini untuk memeriksa URL foto_rumah yang diterima
          console.log('URL Foto Rumah yang diterima:', this.warga?.foto_rumah);
        } else {
          this.errorMessage = 'Struktur respons API tidak valid.';
          console.error('Invalid API response structure:', response);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Gagal mengambil data profil warga:', error);
        this.errorMessage = 'Gagal memuat profil warga. Silakan coba lagi.';
        if (error.status === 401) {
            this.errorMessage = 'Sesi Anda telah berakhir atau tidak terautentikasi. Silakan login kembali.';
        } else if (error.status === 404) {
            this.errorMessage = 'Profil warga tidak ditemukan untuk pengguna ini.';
        }
        this.isLoading = false;
      }
    });
  }
}
