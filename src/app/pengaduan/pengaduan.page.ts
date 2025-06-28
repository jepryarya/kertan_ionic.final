import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // HttpClient tetap digunakan
import { AlertController, LoadingController, ToastController, Platform } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';// Import AuthService

@Component({
  selector: 'app-pengaduan',
  templateUrl: './pengaduan.page.html',
  styleUrls: ['./pengaduan.page.scss'],
  standalone: false
})
export class PengaduanPage implements OnInit {

  kategoris: { nama: string, icon: string }[] = [];
  selectedKategori: string | null = null;
  isiPengaduan: string = '';
  fotoLaporanFile: File | null = null;
  fotoLaporanPreview: string | ArrayBuffer | null = null;

  selectedSegment: string = 'ajukan';
  selectedStatusFilter: 'menunggu' | 'diproses' | 'selesai' | 'ditolak' | 'semua' = 'menunggu';

  pengaduans: any[] = []; // Tetap any[] jika tidak ada interface PengaduanItem
  isLoadingHistory: boolean = false;

  private submitApiUrl = 'https://kertan.hexaboy.com/api/warga/ajukan-pengaduan';
  private historyApiUrl = 'https://kertan.hexaboy.com/api/warga/pengaduan-saya';

  private authToken: string | null = null;
  private wargaId: number | null = null;

  constructor(
    private http: HttpClient,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private platform: Platform,
    private router: Router,
    private authService: AuthService // Suntikkan AuthService
  ) { }

  async ngOnInit() {
    this.kategoris = [
      { nama: 'Infrastruktur', icon: 'hammer' },
      { nama: 'Keamanan', icon: 'lock-closed' },
      { nama: 'Kebersihan', icon: 'brush' },
      { nama: 'Sosial', icon: 'people' },
      { nama: 'Aspirasi', icon: 'bulb' },
      { nama: 'Lainnya', icon: 'document-text' },
    ];

    await this.loadAuthData(); // Memuat data autentikasi

    // Hanya muat riwayat jika pengguna sudah login dan wargaId tersedia
    if (this.authToken && this.wargaId !== null) {
      await this.loadPengaduanHistory();
    } else {
      // Jika tidak ada token atau wargaId, pastikan alert dipresentasikan dan diarahkan ke login
      console.warn('User not authenticated (PengaduanPage ngOnInit). Displaying alert and redirecting.');
      this.presentAlert('Autentikasi Diperlukan', 'Anda perlu login untuk mengakses fitur ini.');
      this.router.navigateByUrl('/login', { replaceUrl: true });
    }
  }

  // --- Metode untuk Mengambil Data Autentikasi ---
  async loadAuthData() {
    // Menggunakan AuthService untuk mengambil token dan user data
    this.authToken = await this.authService.getToken();
    const userData = await this.authService.getUserData();

    if (userData && typeof userData.id === 'number') { // Pastikan ID adalah angka
      this.wargaId = userData.id;
      console.log('Warga ID dari storage (via AuthService):', this.wargaId);
    } else {
      this.wargaId = null; // Pastikan wargaId null jika user data tidak lengkap/tidak ada
      console.warn('Warga ID not found or invalid in user data.');
    }

    // Pengecekan ini menjadi lebih sederhana karena AuthService mengelola storage
    if (!this.authToken || this.wargaId === null) {
      console.warn('Autentikasi diperlukan. Melakukan redirect.');
      // Alert akan dipresentasikan di ngOnInit atau saat panggilan API jika kondisi ini true
      // Kita tidak perlu memanggil presentAlert dan router.navigateByUrl di sini lagi
      // karena sudah ditangani di ngOnInit atau di penanganan error API.
    }
  }

  // --- Metode Pengajuan Pengaduan ---
  selectKategori(namaKategori: string) {
    this.selectedKategori = namaKategori;
    console.log('Kategori dipilih:', this.selectedKategori);
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        this.presentAlert('Format File Tidak Valid', 'Mohon unggah file dalam format JPG, JPEG, atau PNG.');
        this.clearFotoLaporan();
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.presentAlert('Ukuran File Terlalu Besar', 'Ukuran file maksimal 5MB.');
        this.clearFotoLaporan();
        return;
      }

      this.fotoLaporanFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.fotoLaporanPreview = reader.result;
      };
      reader.readAsDataURL(file);
    } else {
      this.clearFotoLaporan();
    }
  }

  clearFotoLaporan() {
    this.fotoLaporanFile = null;
    this.fotoLaporanPreview = null;
    const fileInput = document.getElementById('fotoLaporanInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  async submitPengaduan() {
    if (!this.selectedKategori) {
      this.presentAlert('Peringatan', 'Mohon pilih kategori pengaduan.');
      return;
    }

    if (!this.isiPengaduan.trim()) {
      this.presentAlert('Peringatan', 'Isi pengaduan tidak boleh kosong.');
      return;
    }

    // Pastikan autentikasi sudah ada sebelum mengirim permintaan HTTP
    if (!this.authToken || this.wargaId === null) {
        this.presentAlert('Error', 'Sesi Anda telah berakhir atau tidak valid. Mohon login kembali.');
        this.router.navigateByUrl('/login', { replaceUrl: true });
        return;
    }

    const loading = await this.loadingController.create({
      message: 'Mengirim pengaduan...',
    });
    await loading.present();

    const formData = new FormData();
    formData.append('warga_id', this.wargaId.toString());
    formData.append('kategori', this.selectedKategori);
    formData.append('isi_pengaduan', this.isiPengaduan);

    if (this.fotoLaporanFile) {
      formData.append('foto_laporan', this.fotoLaporanFile, this.fotoLaporanFile.name);
    }

    const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.authToken}`
    });

    this.http.post(this.submitApiUrl, formData, { headers: headers }).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        console.log('Respon API (Submit):', res);
        if (res.message) {
          this.presentToast('Pengaduan berhasil dikirim!', 'success');
          this.resetForm();
          // Setelah submit, pastikan kita memuat ulang riwayat dengan filter yang sedang aktif
          await this.loadPengaduanHistory();
          this.selectedSegment = 'riwayat'; // Pindah ke tab riwayat setelah sukses
        } else {
          this.presentAlert('Error', 'Terjadi kesalahan tidak terduga dari server.');
        }
      },
      error: async (err) => {
        await loading.dismiss();
        console.error('Error saat mengirim pengaduan:', err);

        let errorMessage = 'Tidak dapat terhubung ke server. Mohon coba lagi nanti.';
        if (err.status === 401) {
            errorMessage = 'Sesi Anda telah berakhir atau tidak sah. Mohon login kembali.';
            // Hapus token lokal jika 401, untuk memaksa login ulang
            await this.authService.logout();
            this.router.navigateByUrl('/login', { replaceUrl: true });
        } else if (err.error && err.error.message) {
          errorMessage = err.error.message;
        } else if (err.status === 422 && err.error && err.error.errors) {
          errorMessage = 'Silakan periksa kembali input Anda:\n';
          for (const key in err.error.errors) {
            errorMessage += `- ${err.error.errors[key].join(', ')}\n`;
          }
        }
        this.presentAlert('Error', errorMessage);
      },
    });
  }

  // --- Metode untuk Riwayat Pengaduan ---

  // Metode untuk menangani perubahan segment filter status
  async filterStatusChanged() {
      // Saat filter status berubah, muat ulang riwayat pengaduan
      await this.loadPengaduanHistory();
  }

  async loadPengaduanHistory() {
    this.isLoadingHistory = true;
    const loading = await this.loadingController.create({
      message: 'Memuat riwayat pengaduan...',
      duration: 0
    });
    await loading.present();

    // Pastikan token sudah ada sebelum membuat permintaan HTTP
    if (!this.authToken) {
        await loading.dismiss();
        this.presentAlert('Error', 'Token autentikasi tidak ditemukan untuk memuat riwayat. Silakan login.');
        this.router.navigateByUrl('/login', { replaceUrl: true });
        this.isLoadingHistory = false;
        return;
    }

    const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.authToken}`
    });

    this.http.get(this.historyApiUrl, { headers: headers }).subscribe({
      next: async (res: any) => {
        await loading.dismiss();
        console.log('Respon API (Riwayat):', res);
        if (res.data && Array.isArray(res.data)) {
          let allPengaduans = res.data;

          if (this.selectedStatusFilter === 'semua') {
            this.pengaduans = allPengaduans;
          } else {
            this.pengaduans = allPengaduans.filter((p: any) => p.status === this.selectedStatusFilter);
          }

          this.pengaduans.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          this.presentToast('Riwayat pengaduan berhasil dimuat.', 'success');
        } else {
          this.pengaduans = [];
          this.presentToast('Tidak ada data riwayat pengaduan.', 'warning');
        }
        this.isLoadingHistory = false;
      },
      error: async (err) => {
        await loading.dismiss();
        console.error('Error saat memuat riwayat pengaduan:', err);
        let errorMessage = 'Gagal memuat riwayat pengaduan. Mohon coba lagi.';
        if (err.status === 401) {
            errorMessage = 'Sesi Anda telah berakhir atau tidak sah. Mohon login kembali.';
            // Hapus token lokal jika 401, untuk memaksa login ulang
            await this.authService.logout();
            this.router.navigateByUrl('/login', { replaceUrl: true });
        } else if (err.error && err.error.message) {
            errorMessage = err.error.message;
        }
        this.presentAlert('Error', errorMessage);
        this.isLoadingHistory = false;
      }
    });
  }

  // Fungsi untuk mendapatkan warna badge berdasarkan status
  getStatusColor(status: string): string {
    switch (status) {
      case 'menunggu':
        return 'warning';
      case 'diproses':
        return 'primary';
      case 'selesai':
        return 'success';
      case 'ditolak':
        return 'danger';
      default:
        return 'medium';
    }
  }

  // Fungsi untuk mendapatkan label status yang lebih user-friendly
  getStatusLabel(status: string): string {
    switch (status) {
      case 'menunggu':
        return 'Menunggu Persetujuan';
      case 'diproses':
        return 'Sedang Diproses';
      case 'selesai':
        return 'Selesai';
      case 'ditolak':
        return 'Ditolak';
      default:
        return status;
    }
  }

  // Fungsi untuk format tanggal
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // --- Helper Methods ---
  resetForm() {
    this.selectedKategori = null;
    this.isiPengaduan = '';
    this.clearFotoLaporan();
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }
}