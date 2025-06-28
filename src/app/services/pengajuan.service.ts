// src/app/services/pengajuan.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Import HttpHeaders
import { Observable } from 'rxjs';
import { AuthService } from './auth.service'; // Asumsi Anda punya AuthService

export interface PengajuanSurat {
  id?: number;
  warga_id?: number;
  jenis_surat: string;
  keterangan?: string;
  status?: 'menunggu' | 'disetujui' | 'ditolak';
  created_at?: string;
  updated_at?: string;
  foto_surat_path?: string; // Kembali ke nama kolom database Anda jika itu yang dikirim backend
  attachment_url?: string; // Ini adalah URL lengkap yang bisa langsung dipakai
  nama_warga?: string;
  status_display?: string;
  diajukan_pada?: string;
  // Jika Anda mengirim 'keperluan_surat' dan 'tanggal_diperlukan' dari backend, tambahkan di sini
  // keperluan_surat?: string;
  // tanggal_diperlukan?: string;
}

// Interface untuk respons dari API list pengajuan
interface PengajuanListResponse {
  message: string;
  data: PengajuanSurat[]; // Jika backend mengirimnya dalam objek data
}

// Interface untuk respons dari API detail pengajuan
interface PengajuanDetailResponse {
  message: string;
  data: PengajuanSurat;
}


@Injectable({
  providedIn: 'root'
})
export class PengajuanService {
  private baseUrl = 'https://kertan.hexaboy.com/api'; // Pastikan ini URL yang benar

  // Inject AuthService jika token disimpan di sana
  constructor(private http: HttpClient, private authService: AuthService) { }

  private getAuthHeaders(): HttpHeaders {
    // Asumsi AuthService memiliki metode untuk mendapatkan token JWT
    const token = this.authService.getToken(); // Sesuaikan dengan cara Anda mendapatkan token
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`
      });
    }
    return new HttpHeaders(); // Kembalikan header kosong jika tidak ada token (mungkin untuk endpoint publik)
  }

  createPengajuanWarga(formData: FormData): Observable<any> {
    const headers = this.getAuthHeaders(); // Gunakan header dengan token
    return this.http.post(`${this.baseUrl}/warga/ajukan-surat`, formData, { headers: headers });
  }

  // Jika API Anda mengembalikan { message: ..., data: [...] }
  getMyPengajuansWarga(): Observable<PengajuanListResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<PengajuanListResponse>(`${this.baseUrl}/warga/pengajuan-saya`, { headers: headers });
  }

  // Jika API Anda mengembalikan { message: ..., data: { ... } }
  showMyPengajuanWarga(id: number): Observable<PengajuanDetailResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<PengajuanDetailResponse>(`${this.baseUrl}/warga/pengajuan-saya/${id}`, { headers: headers });
  }
}