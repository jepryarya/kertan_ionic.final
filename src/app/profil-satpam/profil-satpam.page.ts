import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Import HttpClient untuk melakukan panggilan API
import { environment } from '../../environments/environment'; // Asumsi ada file environment.ts untuk URL API
import { AuthService } from '../services/auth.service'; // Import AuthService

// Interface untuk model Satpam agar TypeScript lebih aman
interface Satpam {
  id: number;
  nama: string;
  no_hp: string;
  shift: 'pagi' | 'siang' | 'malam'; // Tipe enum
  akun_user_id: number;
  foto_satpam?: string; // Tanda tanya berarti properti ini opsional
  created_at: string;
  updated_at: string;
}

@Component({
  standalone: false, // Sesuaikan dengan konfigurasi modul Anda
  selector: 'app-profil-satpam',
  templateUrl: './profil-satpam.page.html',
  styleUrls: ['./profil-satpam.page.scss'],
})
export class ProfilSatpamPage implements OnInit {

  // Properti untuk menyimpan data satpam yang diambil dari API
  satpam: Satpam | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;

  // Injeksi HttpClient dan AuthService di constructor
  constructor(private http: HttpClient, private authService: AuthService) { }

  ngOnInit() {
    // Panggil metode untuk mengambil profil satpam saat komponen diinisialisasi
    this.getSatpamProfile();
  }

  /**
   * Mengambil data profil satpam dari API Laravel.
   * Menggunakan endpoint GET /api/satpam-data.
   */
  async getSatpamProfile() { // Tambahkan async karena akan menggunakan await
    this.isLoading = true;
    this.errorMessage = null;

    // Mendapatkan token autentikasi dari AuthService
    const authToken = await this.authService.getToken();

    if (!authToken) {
      this.errorMessage = 'Token otentikasi tidak ditemukan. Harap login.';
      this.isLoading = false;
      console.error('Authentication token not found.');
      return;
    }

    // Menyiapkan header HTTP dengan token Bearer
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    });

    // Melakukan panggilan HTTP GET ke endpoint profil satpam
    // Menggunakan '/api-satpam-data' sesuai dengan rute yang Anda sebutkan
    const apiUrl = `${environment.apiUrl}/api-satpam-data`; // <-- Sudah disesuaikan di sini!

    this.http.get<any>(apiUrl, { headers }).subscribe({
      next: (response) => {
        if (response && response.data) { // Asumsi respons API memiliki struktur { data: {...} }
          this.satpam = response.data; // Simpan data satpam yang diterima
          console.log('Data satpam berhasil dimuat:', this.satpam);
          // Tambahkan console.log ini untuk memeriksa URL foto_satpam yang diterima
          console.log('URL Foto Satpam yang diterima:', this.satpam?.foto_satpam);
        } else {
          this.errorMessage = 'Struktur respons API tidak valid.';
          console.error('Invalid API response structure:', response);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Gagal mengambil data profil satpam:', error);
        this.errorMessage = 'Gagal memuat profil satpam. Silakan coba lagi.';
        if (error.status === 401) {
            this.errorMessage = 'Sesi Anda telah berakhir atau tidak terautentikasi. Silakan login kembali.';
        } else if (error.status === 404) {
            this.errorMessage = 'Profil satpam tidak ditemukan untuk pengguna ini.';
        }
        this.isLoading = false;
      }
    });
  }
}
