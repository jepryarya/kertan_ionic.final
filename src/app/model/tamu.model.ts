// src/app/model/tamu.model.ts

export interface Tamu {
  // ... properti tamu lainnya
  nama_tamu: string;
  waktu_masuk: string;
  waktu_keluar?: string;
}

export interface LaporanHarianResponse {
  status: string;
  message?: string;
  total_tamu: number;
  data: Tamu[];
}

export interface RekapMingguanItem {
  minggu_ke: number;
  total_tamu_mingguan: number;
}

export interface RekapMingguanResponse {
  status: string;
  message?: string;
  data: RekapMingguanItem[];
}

export interface RekapBulananItem {
  bulan_angka: number; // Angka bulan (1-12)
  bulan_nama: string; // Nama bulan (misal: "Januari")
  total_tamu_masuk: number;
}

export interface RekapBulananResponse {
  status: string;
  message?: string;
  data: RekapBulananItem[];
}

export interface RekapTahunanItem {
  tahun: number;
  total_tamu_masuk: number;
}

export interface RekapTahunanResponse {
  status: string;
  message?: string;
  data: RekapTahunanItem[];
}