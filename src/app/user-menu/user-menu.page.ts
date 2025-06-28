// src/app/user-menu/user-menu.page.ts

import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { LoadingController, AlertController } from '@ionic/angular'; // Import LoadingController dan AlertController

// --- INTERFACE YANG DIBUTUHKAN ---
interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
  total_tamu?: number;
}

interface TamuData {
  id: number;
  nama_tamu: string;
  no_identitas: string;
  alamat_asal: string;
  ke_rumah: string;
  alasan_kunjungan: string;
  waktu_masuk: string;
  waktu_keluar: string | null;
  status: string;
  foto_ktp: string | null;
  foto_ktp_url: string | null;
  created_at: string;
  updated_at: string;
}

interface WargaData {
  id: number;
  nama: string;
  no_hp: string;
  alamat_rumah: string;
  nik: string;
}

@Component({
  standalone: false,
  selector: 'app-user-menu',
  templateUrl: './user-menu.page.html',
  styleUrls: ['./user-menu.page.scss'],
})
export class UserMenuPage implements OnInit {
  // ======= SIDEBAR STATE =======
  menuOpen = false;

  // ======= LOGOUT MODAL STATE =======
  showLogoutConfirm = false;

  // ======= DATA STATISTIK USER =======
  // MODIFIKASI: Menghilangkan entri 'Surat Diproses'
  userStatsData = [
    { title: 'Total Warga', value: 0, desc: 'Warga Terdaftar' },
    { title: 'Tamu Hari Ini', value: 0, desc: 'Tamu Masuk Hari Ini' }
    // { title: 'Surat Diproses', value: 0, desc: 'Pengajuan Terbaru' } <-- Baris ini dihapus
  ];

  // ======= DATA TAMU MASUK TERBARU (untuk "Tamu Terakhir ke Rumah Anda") =======
  tamuMasukTerbaru: { nama: string; ktp: string; tujuan: string; foto: string | null; waktuMasuk: string; ke_rumah: string }[] = [];

  // ======= DATA TAMU KELUAR TERBARU =======
  tamuKeluar: { nama: string; ktp: string; tujuan: string; foto: string | null; waktuKeluar: string; ke_rumah: string }[] = [];

  // ======= DATA WARGA SEKITAR =======
  wargaData: { id: number; nama: string; telp: string; alamat: string; ktp: string; foto: string | null }[] = [];

  // Alamat dasar API Laravel Anda
  private apiUrl = 'https://kertan.hexaboy.com/api';

  // ID pengguna yang sedang login (harus didapatkan dari sistem autentikasi Anda)
  private userId: number = 1; // Contoh, sesuaikan dengan cara Anda mendapatkan ID pengguna yang login

  constructor(
    private router: Router,
    private http: HttpClient,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    private loadingController: LoadingController, // Injeksi LoadingController
    private alertController: AlertController // Injeksi AlertController
  ) {}

  ngOnInit() {
    this.menuOpen = false;
    this.loadUserDashboardData(); // Memuat data saat halaman pertama kali diinisialisasi
  }

  async loadUserDashboardData() { // Ubah menjadi async untuk menggunakan await
    const loading = await this.loadingController.create({
      message: 'Memuat data...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      // Memuat total warga dan data warga sekitar
      const wargaResponse = await this.http.get<WargaData[]>(`${this.apiUrl}/warga-data`).toPromise();
      if (wargaResponse) {
        const totalWarga = wargaResponse.length;
        this.userStatsData[0].value = totalWarga;

        this.wargaData = wargaResponse.map((warga: WargaData) => ({
          id: warga.id,
          nama: warga.nama,
          telp: warga.no_hp,
          alamat: warga.alamat_rumah,
          ktp: warga.nik,
          foto: 'https://www.gravatar.com/avatar/?d=mp' // Placeholder foto
        }));
      }

      // Memuat data tamu hari ini, tamu terakhir ke rumah, dan tamu keluar terbaru
      const tamuResponse = await this.http.get<ApiResponse<TamuData[]>>(`${this.apiUrl}/tamu-laporan/harian`).toPromise();
      console.log('API Response (User Menu):', tamuResponse);
      if (tamuResponse && tamuResponse.status === 'success' && tamuResponse.data) {
        const allTamuHariIni = tamuResponse.data;

        this.userStatsData[1].value = tamuResponse.total_tamu || 0;

        const tamuKeRumahPengguna = allTamuHariIni.filter(tamu =>
          tamu.ke_rumah && tamu.status === 'masuk'
        );

        console.log('Tamu masuk terbaru setelah filter (User):', tamuKeRumahPengguna);

        this.tamuMasukTerbaru = tamuKeRumahPengguna
          .sort((a, b) => new Date(b.waktu_masuk).getTime() - new Date(a.waktu_masuk).getTime())
          .slice(0, 3)
          .map((tamu: TamuData) => ({
            nama: tamu.nama_tamu,
            ktp: tamu.no_identitas,
            tujuan: tamu.alasan_kunjungan,
            foto: 'https://placehold.co/100x100/FF5733/FFFFFF?text=Tamu',
            waktuMasuk: new Date(tamu.waktu_masuk).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            ke_rumah: tamu.ke_rumah
          }));

        const tamuKeluarHariIni = allTamuHariIni.filter(tamu => tamu.status === 'keluar');

        console.log('Tamu keluar terbaru setelah filter (User):', tamuKeluarHariIni);

        this.tamuKeluar = tamuKeluarHariIni
          .sort((a, b) => {
            const timeA = a.waktu_keluar ? new Date(a.waktu_keluar).getTime() : 0;
            const timeB = b.waktu_keluar ? new Date(b.waktu_keluar).getTime() : 0;
            return timeB - timeA;
          })
          .slice(0, 3)
          .map((tamu: TamuData) => ({
            nama: tamu.nama_tamu,
            ktp: tamu.no_identitas,
            tujuan: tamu.alasan_kunjungan,
            foto: 'https://placehold.co/100x100/33FF57/FFFFFF?text=Keluar',
            waktuKeluar: tamu.waktu_keluar ? new Date(tamu.waktu_keluar).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Belum Keluar',
            ke_rumah: tamu.ke_rumah
          }));
      }
    } catch (error) {
      console.error('Gagal memuat data dashboard:', error);
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Gagal memuat data. Mohon coba lagi.',
        buttons: ['OK']
      });
      await alert.present();
    } finally {
      await loading.dismiss(); // Pastikan loading dihilangkan terlepas dari hasil
    }
  }

  // --- Fungsi Handle Refresh ---
  async handleRefresh(event: any) {
    console.log('Memulai operasi refresh...');
    await this.loadUserDashboardData(); // Panggil fungsi untuk memuat ulang data
    event.target.complete(); // Beri sinyal kepada refresher bahwa operasi telah selesai
    console.log('Refresh selesai!');
  }

  // ======= FUNGSI-FUNGSI NAVIGASI DAN UI =======
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  openLogoutConfirm() {
    this.showLogoutConfirm = true;
  }

  closeLogoutConfirm(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.showLogoutConfirm = false;
  }

  confirmLogout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('User has logged out via AuthService.');
        this.showLogoutConfirm = false;
        this.menuOpen = false;
        this.router.navigateByUrl('/login'); // Redirect ke halaman login setelah logout
      },
      error: (err) => {
        console.error('Logout failed:', err);
        this.showLogoutConfirm = false;
        this.menuOpen = false;
      }
    });
  }

  stopPropagation(event: Event) {
    event.stopPropagation();
  }

  goToPengajuanSaya() {
    this.toggleMenu();
    this.router.navigate(['/user-letter-submission']);
  }

  goToPengaduanSaya() {
    this.toggleMenu();
    this.router.navigate(['/user-complaints']);
  }
}