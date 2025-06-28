import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { IonRefresher, ToastController, AlertController } from '@ionic/angular'; // Ditambahkan: IonRefresher, ToastController, AlertController

// --- TAMBAHKAN INTERFACE INI ---
interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
  total_tamu?: number; // Opsional, hanya ada di laporan harian
}

interface TamuData {
  id: number;
  nama_tamu: string;
  no_identitas: string;
  alamat_asal: string;
  ke_rumah: string; // Menambahkan properti ke_rumah
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

interface MonthlyRekapData {
  bulan_angka: number;
  bulan_nama: string;
  total_tamu_masuk: number;
}
// --- AKHIR PENAMBAHAN INTERFACE ---

@Component({
  standalone: false,
  selector: 'app-admin-menu',
  templateUrl: './admin-menu.page.html',
  styleUrls: ['./admin-menu.page.scss']
})
export class AdminMenuPage implements OnInit {
  // ======= SIDEBAR STATE =======
  menuOpen = false; // Status buka/tutup sidebar

  // ======= LOGOUT MODAL STATE =======
  showLogoutConfirm = false; // Status tampilan modal konfirmasi logout

  // Menambahkan ViewChild untuk IonRefresher
  @ViewChild(IonRefresher) refresher!: IonRefresher;

  // ======= DATA STATISTIK =======
  statsData = [
    { title: 'Warga', value: 0, desc: 'Total Warga' },
    { title: 'Tamu Hari Ini', value: 0, desc: 'Tamu Masuk' },
    { title: 'Tamu Bulan Ini', value: 0, desc: 'Akumulasi Bulanan' }
  ];

  // ======= DATA TAMU MASUK (tampil maksimal 3) =======
  // Mengupdate tipe untuk menyertakan ke_rumah
  tamuHariIni: { nama: string; ktp: string; tujuan: string; foto: string | null; ke_rumah: string }[] = [];

  // ======= DATA TAMU KELUAR GERBANG (tampil maksimal 3) =======
  // Mengupdate tipe untuk menyertakan ke_rumah
  tamuKeluar: { nama: string; ktp: string; tujuan: string; foto: string | null; ke_rumah: string }[] = [];

  // ======= DATA WARGA (tampil maksimal 4 - akan diubah untuk semua) =======
  wargaData: { id: number; nama: string; telp: string; alamat: string; ktp: string; foto: string | null }[] = [];

  // Alamat dasar API Laravel Anda
  private apiUrl = 'https://kertan.hexaboy.com/api'; // Contoh: ganti dengan URL Laravel Anda

  // ======= KONSTRUKTOR =======
  constructor(
    private router: Router,
    private http: HttpClient,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService, // PENTING: Suntikkan AuthService di sini
    private toastController: ToastController, // Disuntikkan: ToastController
    private alertController: AlertController // Disuntikkan: AlertController (jika diperlukan untuk dialog konfirmasi lainnya)
  ) {}

  // ======= HOOK: SAAT KOMPONEN DI-INIT =======
  ngOnInit() {
    this.menuOpen = false;
    this.loadDashboardData();
  }

  // ======= FUNGSI UNTUK MEMUAT DATA DASHBOARD DARI API =======
  async loadDashboardData() { // Mengubah menjadi async untuk penggunaan await
    console.log('Memuat data dashboard...');
    try {
      // 1. Memuat statistik & tamu harian
      const response = await this.http.get<ApiResponse<TamuData[]>>(`${this.apiUrl}/tamu-laporan/harian`).toPromise();

      if (response && response.status === 'success' && response.data) {
        const totalTamuHariIni = response.total_tamu || 0;

        // Memuat total warga
        const wargaResponse = await this.http.get<WargaData[]>(`${this.apiUrl}/warga-data`).toPromise();
        if (wargaResponse) {
          const totalWarga = wargaResponse.length;
          this.statsData[0].value = totalWarga;

          this.wargaData = wargaResponse.map((warga: WargaData) => ({
            id: warga.id,
            nama: warga.nama,
            telp: warga.no_hp,
            alamat: warga.alamat_rumah,
            ktp: warga.nik,
            foto: 'https://www.gravatar.com/avatar/?d=mp' // Ganti jika ada URL foto warga dari backend
          }));
        }

        // Memuat total tamu bulan ini
        const monthlyResponse = await this.http.get<ApiResponse<MonthlyRekapData[]>>(`${this.apiUrl}/tamu-laporan/bulanan-rekap`).toPromise();
        if (monthlyResponse && monthlyResponse.status === 'success' && monthlyResponse.data) {
          const currentMonth = new Date().getMonth() + 1;
          const tamuBulanIniEntry = monthlyResponse.data.find((item: MonthlyRekapData) => item.bulan_angka === currentMonth);
          if (tamuBulanIniEntry) {
            this.statsData[2].value = tamuBulanIniEntry.total_tamu_masuk;
          }
        }

        this.statsData[1].value = totalTamuHariIni;

        // Filter tamu masuk dan keluar untuk tampilan singkat
        const allTamuHariIni = response.data;
        this.tamuHariIni = allTamuHariIni
          .filter((tamu: TamuData) => tamu.status.toLowerCase() === 'masuk') // Pastikan case-insensitive
          .slice(0, 3)
          .map((tamu: TamuData) => ({
            nama: tamu.nama_tamu,
            ktp: tamu.no_identitas,
            tujuan: tamu.alasan_kunjungan,
            foto: 'https://placehold.co/100x100/FF5733/FFFFFF?text=Tamu', // Placeholder foto
            ke_rumah: tamu.ke_rumah // Memastikan ke_rumah disertakan
          }));

        this.tamuKeluar = allTamuHariIni
          .filter((tamu: TamuData) => tamu.status.toLowerCase() === 'keluar') // Pastikan case-insensitive
          .slice(0, 3)
          .map((tamu: TamuData) => ({
            nama: tamu.nama_tamu,
            ktp: tamu.no_identitas,
            tujuan: tamu.alasan_kunjungan,
            foto: 'https://placehold.co/100x100/33FF57/FFFFFF?text=Keluar', // Placeholder foto
            ke_rumah: tamu.ke_rumah // Memastikan ke_rumah disertakan
          }));
      }
    } catch (error) {
      console.error('Gagal memuat data dashboard:', error);
      // Anda bisa menambahkan pesan error ke UI jika perlu
      this.presentToast('Gagal memuat data dashboard. Silakan coba lagi.', 'danger');
    }
  }

  // ======= HANDLER PULL-TO-REFRESH =======
  async handleRefresh(event: any) {
    console.log('Melakukan pull-to-refresh pada dashboard...');
    try {
      await this.loadDashboardData(); // Panggil kembali fungsi pemuatan data
      this.presentToast('Data dashboard berhasil dimuat ulang.', 'success');
    } catch (error) {
      console.error('Gagal memuat ulang data dashboard:', error);
      this.presentToast('Gagal memuat ulang data dashboard.', 'danger');
    } finally {
      event.target.complete(); // Selesaikan animasi refresher
    }
  }

  // ======= TOGGLE SIDEBAR MENU =======
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  // ======= ARAHKAN KE HALAMAN PROFIL =======
  goToProfile() {
    this.router.navigate(['/profil-satpam']); // Mengubah ke /profil-satpam sesuai menu
  }

  // ======= FUNGSI BARU: ARAHKAN UNTUK MENGIRIM PESAN KE WARGA TERTENTU =======
  sendMessageToWarga(wargaId: number) {
    this.router.navigate(['/pesan-ke-warga', wargaId]);
  }

  // ======= ARAHKAN KE HALAMAN PESAN KE WARGA (umum) =======
  goToPesanWarga() {
    this.router.navigate(['/pesan-ke-warga']);
  }

  // ======= TAMPILKAN MODAL LOGOUT =======
  openLogoutConfirm() {
    this.showLogoutConfirm = true;
  }

  // ======= TUTUP MODAL LOGOUT =======
  closeLogoutConfirm(event?: Event) {
    if (event) {
      event.stopPropagation(); // Mencegah penutupan saat mengklik di dalam kartu
    }
    this.showLogoutConfirm = false;
  }

  // ======= AKSI LOGOUT, RESET SIDEBAR & REDIRECT =======
  confirmLogout() {
    // Memanggil metode logout dari AuthService untuk menghapus token
    this.authService.logout().subscribe({
      next: () => {
        console.log('Admin has logged out via AuthService.');
        // AuthService sudah menangani navigasi ke /login dan membersihkan state
        this.showLogoutConfirm = false;
        this.menuOpen = false;
        // Tidak perlu router.navigate di sini jika AuthService sudah menanganinya
      },
      error: (err) => {
        console.error('Admin logout failed:', err);
        // AuthService sudah menampilkan toast error, tapi bisa tambahkan logika lain jika perlu
        this.showLogoutConfirm = false;
        this.menuOpen = false;
      }
    });
  }

  // ======= STOP PROPAGATION FOR MODAL CARD =======
  stopPropagation(event: Event) {
    event.stopPropagation(); // Mencegah klik pada kartu modal agar tidak menutupnya
  }

  // Fungsi utilitas untuk menampilkan Toast
  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'bottom',
    });
    toast.present();
  }
}