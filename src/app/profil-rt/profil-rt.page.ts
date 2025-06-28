import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common'; // Diperlukan untuk *ngIf, *ngFor
import { IonicModule } from '@ionic/angular'; // Diperlukan untuk komponen Ionic
import { finalize } from 'rxjs/operators'; // Diperlukan untuk indikator loading
import { RouterModule } from '@angular/router'; // Diperlukan untuk routing

// Interface untuk struktur data RT yang diterima dari API
interface RtData {
  id: number;
  nama: string;
  no_hp: string;
  periode_mulai: number;
  periode_selesai: number;
  Maps_link: string | null;
  foto: string | null; // Nama file foto di server
  foto_url: string | null; // URL lengkap foto (disediakan oleh API)
  created_at: string;
  updated_at: string;
}

// Interface untuk struktur respons API keseluruhan
interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

@Component({
  standalone: false, // Diubah menjadi false
  selector: 'app-profil-rt', // Diubah agar sesuai dengan nama file `profil-rt`
  templateUrl: './profil-rt.page.html', // Pastikan nama ini juga sesuai
  styleUrls: ['./profil-rt.page.scss'], // Pastikan nama ini juga sesuai
  // Imports tidak diperlukan lagi di sini jika standalone: false
  // imports: [CommonModule, IonicModule, RouterModule]
})
export class ProfilRtPage implements OnInit { // Nama kelas diubah menjadi ProfilRtPage
  rtData: RtData | null = null;
  isLoading: boolean = false;
  errorMessage: string | null = null;

  // Ganti dengan URL dasar API Laravel Anda
  private apiUrl = 'https://kertan.hexaboy.com/api';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadRtData();
  }

  // Fungsi untuk memuat data RT dari API
  loadRtData() {
    this.isLoading = true; // Aktifkan indikator loading
    this.errorMessage = null; // Reset pesan error

    this.http.get<ApiResponse<RtData>>(`${this.apiUrl}/rt`)
      .pipe(
        finalize(() => {
          this.isLoading = false; // Nonaktifkan indikator loading setelah permintaan selesai
        })
      )
      .subscribe({
        next: (response) => {
          if (response.status === 'success' && response.data) {
            this.rtData = response.data;
            console.log('Data RT berhasil dimuat:', this.rtData);
          } else {
            this.errorMessage = response.message || 'Gagal memuat data RT.';
            console.error('Error dari API:', response.message);
          }
        },
        error: (error) => {
          this.errorMessage = 'Tidak ada data RT yang terdaftar.';
          console.error('Error saat melakukan permintaan HTTP:', error);
        }
      });
  }

  // Fungsi pembantu untuk membuka link Google Maps
  openMapsLink() {
    if (this.rtData && this.rtData.Maps_link) {
      window.open(this.rtData.Maps_link, '_system'); // _system untuk membuka di browser eksternal
    }
  }

  // Fungsi pembantu untuk memformat periode
  getPeriodText(): string {
    if (this.rtData) {
      return `${this.rtData.periode_mulai} - ${this.rtData.periode_selesai}`;
    }
    return '-';
  }
}
