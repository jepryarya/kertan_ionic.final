import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { AlertController } from '@ionic/angular';

// Interface untuk struktur data tamu
interface Tamu {
  id: number;
  nama: string;
  no_identitas: string;
  foto_ktp: string | null;
  foto_ktp_url: string | null; // Pastikan ini ada di interface
  alamat_asal: string;
  ke_rumah: string;
  alasan_kunjungan: string;
  waktu_masuk: string;
  waktu_keluar: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

// Interface untuk struktur respons API Laravel saat mengambil daftar tamu
interface ApiResponse {
  status: string;
  message: string;
  data: Tamu[];
}

// Interface untuk struktur respons API Laravel saat memperbarui status atau menghapus
interface GeneralApiResponse {
  status: string;
  message: string;
  data?: Tamu; // Data tamu yang diperbarui/dihapus (opsional)
  errors?: any; // Untuk validasi error
}

@Component({
  selector: 'app-admin-data-tamu',
  templateUrl: './admin-data-tamu.page.html',
  styleUrls: ['./admin-data-tamu.page.scss'],
  standalone: false
})
export class AdminDataTamuPage implements OnInit {
  tamuList: Tamu[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  editingRowId: number | null = null;
  originalTamuData: Tamu | null = null;


  private readonly BASE_SERVER_URL = environment.apiUrl.replace('/api', '');

  constructor(
    private http: HttpClient,
    private router: Router,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    this.fetchTamuData();
  }

  async fetchTamuData() {
    this.isLoading = true;
    this.errorMessage = null;

    const { value: token } = await Preferences.get({ key: 'sanctum-token' });

    if (!token) {
      this.errorMessage = 'Token autentikasi tidak ditemukan. Harap login kembali.';
      this.isLoading = false;
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<ApiResponse>(`${environment.apiUrl}/data-tamu`, { headers }).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          // --- KODE MODIFIKASI DIMULAI DI SINI ---
          this.tamuList = response.data.map(tamu => {
            // Jika backend sudah mengirim foto_ktp_url yang lengkap, gunakan itu
            if (tamu.foto_ktp_url && (tamu.foto_ktp_url.startsWith('http://') || tamu.foto_ktp_url.startsWith('https://'))) {
              // URL sudah lengkap dari backend, tidak perlu modifikasi
            }
            // Jika backend hanya mengirim nama file di 'foto_ktp' dan 'foto_ktp_url' kosong/null,
            // maka kita akan membangun URL lengkap di frontend.
            else if (tamu.foto_ktp) {
              // INI BARIS YANG SAYA UBAH
              tamu.foto_ktp_url = `${this.BASE_SERVER_URL}/storage/${tamu.foto_ktp}`; //
            } else {
              // Jika tidak ada foto_ktp sama sekali (nama file juga null)
              tamu.foto_ktp_url = null;
            }
            return tamu;
          });
          // --- KODE MODIFIKASI BERAKHIR DI SINI ---
          console.log('Data tamu berhasil diambil dan URL foto diperbarui:', this.tamuList);
        } else {
          this.errorMessage = response.message || 'Terjadi kesalahan saat memuat data tamu.';
          console.error('API respons error:', response.message);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Gagal mengambil data tamu:', err);
        if (err.status === 401) {
          this.errorMessage = 'Sesi Anda telah berakhir atau tidak valid. Harap login kembali.';
          this.router.navigate(['/login']);
        } else if (err.status === 0) {
          this.errorMessage = 'Gagal terhubung ke server. Periksa koneksi Anda atau backend.';
        } else if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Terjadi kesalahan saat memuat data tamu.';
        }
        this.isLoading = false;
      }
    });
  }

  // ... (Sisa kode lainnya tidak berubah) ...

  async onRetryButtonClick() {
    const { value: token } = await Preferences.get({ key: 'sanctum-token' });
    if (!token) {
      this.router.navigate(['/login']);
    } else {
      this.fetchTamuData();
    }
  }

  startEditing(id: number) {
    this.editingRowId = id;
    this.originalTamuData = JSON.parse(JSON.stringify(this.tamuList.find(t => t.id === id) || null));
    console.log(`Memulai pengeditan status untuk tamu ID: ${id}`);
  }

  async saveInlineEdit(tamu: Tamu) {
    this.isLoading = true;
    this.errorMessage = null;

    const { value: token } = await Preferences.get({ key: 'sanctum-token' });

    if (!token) {
      this.errorMessage = 'Token autentikasi tidak ditemukan. Harap login kembali.';
      this.isLoading = false;
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const payload = {
      status: tamu.status
    };

    this.http.put<GeneralApiResponse>(`${environment.apiUrl}/data-tamu/${tamu.id}/status`, payload, { headers }).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          console.log('Status tamu berhasil diperbarui secara inline:', response.data);
          const index = this.tamuList.findIndex(t => t.id === tamu.id);
          if (index !== -1 && response.data) {
            this.tamuList[index].status = response.data.status;
            this.tamuList[index].waktu_keluar = response.data.waktu_keluar;
            this.tamuList[index].updated_at = response.data.updated_at;
          }
          this.editingRowId = null;
          this.originalTamuData = null;
          this.presentAlert('Berhasil', response.message || 'Status tamu berhasil diperbarui!');
        } else {
          this.errorMessage = response.message || 'Gagal memperbarui status tamu secara inline.';
          console.error('API respons error:', response.message);
          this.presentAlert('Error', this.errorMessage ?? 'Terjadi kesalahan tidak dikenal.');
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Gagal memperbarui status tamu secara inline:', err);
        let msg = 'Terjadi kesalahan saat memperbarui status tamu.';
        if (err.status === 422 && err.error && err.error.errors) {
          msg = Object.values(err.error.errors).flat().join('<br>');
        } else if (err.error && err.error.message) {
          msg = err.error.message;
        }
        this.errorMessage = msg;
        this.presentAlert('Error', this.errorMessage ?? 'Terjadi kesalahan tidak dikenal.');
        this.isLoading = false;
      }
    });
  }

  cancelInlineEdit() {
    if (this.editingRowId !== null && this.originalTamuData) {
      const index = this.tamuList.findIndex(t => t.id === this.editingRowId);
      if (index !== -1) {
        this.tamuList[index].status = this.originalTamuData.status;
      }
    }
    this.editingRowId = null;
    this.originalTamuData = null;
    console.log('Pengeditan status dibatalkan.');
  }

  async updateTamuStatus(tamu: Tamu, newStatus: string) {
    const alert = await this.alertController.create({
      header: 'Konfirmasi Perubahan Status',
      message: `Apakah Anda yakin ingin mengubah status tamu "${tamu.nama}" menjadi "${newStatus}"?`,
      buttons: [
        {
          text: 'Batal',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Perubahan status dibatalkan');
          }
        }, {
          text: 'Ya, Ubah',
          handler: async () => {
            this.isLoading = true;
            this.errorMessage = null;

            const { value: token } = await Preferences.get({ key: 'sanctum-token' });

            if (!token) {
              this.errorMessage = 'Token autentikasi tidak ditemukan. Harap login kembali.';
              this.isLoading = false;
              this.router.navigate(['/login']);
              return;
            }

            const headers = new HttpHeaders({
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            });

            const payload = { status: newStatus };

            this.http.put<GeneralApiResponse>(`${environment.apiUrl}/data-tamu/${tamu.id}/status`, payload, { headers }).subscribe({
              next: (response) => {
                if (response.status === 'success') {
                  console.log('Status tamu berhasil diperbarui:', response.data);
                  const index = this.tamuList.findIndex(t => t.id === tamu.id);
                  if (index !== -1 && response.data) {
                    this.tamuList[index].status = response.data.status;
                    this.tamuList[index].waktu_keluar = response.data.waktu_keluar;
                    this.tamuList[index].updated_at = response.data.updated_at;
                  }
                  this.presentAlert('Berhasil', response.message || 'Status tamu berhasil diperbarui!');
                } else {
                  this.errorMessage = response.message || 'Gagal memperbarui status tamu.';
                  console.error('API respons error:', response.message);
                  this.presentAlert('Error', this.errorMessage ?? 'Terjadi kesalahan tidak dikenal.');
                }
                this.isLoading = false;
              },
              error: (err) => {
                console.error('Gagal memperbarui status tamu:', err);
                let msg = 'Terjadi kesalahan saat memperbarui status tamu.';
                if (err.status === 401) {
                  msg = 'Sesi Anda telah berakhir atau tidak valid. Silakan login kembali.';
                  this.router.navigate(['/login']);
                } else if (err.status === 0) {
                  msg = 'Gagal terhubung ke server. Periksa koneksi Anda atau backend.';
                } else if (err.error && err.error.message) {
                  msg = err.error.message;
                } else if (err.status === 422 && err.error && err.error.errors) {
                  msg = Object.values(err.error.errors).flat().join('<br>');
                }
                this.errorMessage = msg;
                this.presentAlert('Error', this.errorMessage ?? 'Terjadi kesalahan tidak dikenal.');
                this.isLoading = false;
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async deleteTamu(id: number, nama: string) {
    const alert = await this.alertController.create({
      header: 'Konfirmasi Hapus',
      message: `Apakah Anda yakin ingin menghapus data tamu "${nama}"? Data yang dihapus tidak dapat dikembalikan.`,
      buttons: [
        {
          text: 'Batal',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Penghapusan dibatalkan');
          }
        }, {
          text: 'Hapus',
          cssClass: 'danger',
          handler: async () => {
            this.isLoading = true;
            this.errorMessage = null;

            const { value: token } = await Preferences.get({ key: 'sanctum-token' });

            if (!token) {
              this.errorMessage = 'Token autentikasi tidak ditemukan. Harap login kembali.';
              this.isLoading = false;
              this.router.navigate(['/login']);
              return;
            }

            const headers = new HttpHeaders({
              'Authorization': `Bearer ${token}`
            });

            this.http.delete<GeneralApiResponse>(`${environment.apiUrl}/data-tamu/${id}`, { headers }).subscribe({
              next: (response) => {
                if (response.status === 'success') {
                  console.log('Tamu berhasil dihapus:', id);
                  this.tamuList = this.tamuList.filter(tamu => tamu.id !== id);
                  this.presentAlert('Berhasil', response.message || 'Data tamu berhasil dihapus!');
                } else {
                  this.errorMessage = response.message || 'Gagal menghapus tamu.';
                  console.error('API respons error:', response.message);
                  this.presentAlert('Error', this.errorMessage ?? 'Terjadi kesalahan tidak dikenal.');
                }
                this.isLoading = false;
              },
              error: (err) => {
                console.error('Gagal menghapus tamu:', err);
                if (err.status === 401) {
                  this.errorMessage = 'Sesi Anda telah berakhir atau tidak valid. Harap login kembali.';
                  this.router.navigate(['/login']);
                } else if (err.status === 0) {
                  this.errorMessage = 'Gagal terhubung ke server. Periksa koneksi Anda atau backend.';
                } else if (err.error && err.error.message) {
                  this.errorMessage = err.error.message;
                } else {
                  this.errorMessage = 'Terjadi kesalahan saat menghapus data tamu.';
                }
                this.presentAlert('Error', this.errorMessage ?? 'Terjadi kesalahan tidak dikenal.');
                this.isLoading = false;
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }
}