import { Component, OnInit } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
import { formatDate } from '@angular/common'; // Diperlukan untuk formatting tanggal ke API

import { TamuLaporanService } from '../services/tamu-laporan.service';
import {
  LaporanHarianResponse,
  RekapMingguanResponse,
  RekapBulananResponse,
  RekapTahunanResponse,
  Tamu,
  RekapBulananItem,
} from '../model/tamu.model';

@Component({
  selector: 'app-grafik-tamu',
  templateUrl: './grafik-tamu.page.html',
  styleUrls: ['./grafik-tamu.page.scss'],
  standalone: false,
})
export class GrafikTamuPage implements OnInit {
  laporanHarian: LaporanHarianResponse = { status: 'loading', total_tamu: 0, data: [] };
  rekapMingguan: RekapMingguanResponse = { status: 'loading', data: [] };
  rekapBulanan: RekapBulananResponse = { status: 'loading', data: [] };
  rekapTahunan: RekapTahunanResponse = { status: 'loading', data: [] };

  selectedDate: string = new Date().toISOString();

  selectedYear: number = new Date().getFullYear();
  selectedYearMonthly: number = new Date().getFullYear();
  selectedMonth: string = new Date().toISOString();

  filteredRekapBulanan: RekapBulananItem[] = [];
  totalTamuPerSelectedMonth: number = 0;

  loading: boolean = false;

  // Properti baru untuk menyimpan daftar tahun yang tersedia
  availableYears: number[] = [];

  constructor(
    private tamuLaporanService: TamuLaporanService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    console.log('Tanggal inisialisasi (ngOnInit):', this.selectedDate);
    this.generateYears(); // Panggil metode untuk menghasilkan daftar tahun
    this.loadAllReports();
  }

  /**
   * Menghasilkan daftar tahun untuk digunakan dalam pemilihan.
   * Rentang tahun adalah dari 5 tahun sebelum tahun saat ini hingga 10 tahun setelahnya.
   */
  generateYears() {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 5; // Mulai dari 5 tahun yang lalu
    const endYear = currentYear + 10;  // Hingga 10 tahun ke depan

    for (let year = startYear; year <= endYear; year++) {
      this.availableYears.push(year);
    }
    // Opsional: Urutkan tahun secara ascending (tidak selalu diperlukan jika sudah berurutan)
    this.availableYears.sort((a, b) => a - b);
    console.log('Tahun yang tersedia:', this.availableYears);
  }

  async handleRefresh(event: any) {
    const now = new Date();
    this.selectedDate = now.toISOString();
    console.log('Tanggal setelah refresh (handleRefresh):', this.selectedDate);
    await this.loadAllReports(event);
    if (event) {
      event.target.complete();
    }
  }

  async loadAllReports(event?: any) {
    if (!event) {
      this.loading = true;
      const loading = await this.loadingCtrl.create({
        message: 'Memuat laporan...',
      });
      await loading.present();
    }

    try {
      await Promise.all([
        this.getLaporanHarianData(),
        this.getRekapMingguanData(),
        this.getRekapBulananData(),
        this.getRekapTahunanData(this.selectedYear),
      ]);
    } catch (error) {
      console.error('Gagal memuat semua laporan:', error);
      this.presentToast('Gagal memuat laporan. Silakan coba lagi.', 'danger');
    } finally {
      if (!event) {
        await this.loadingCtrl.dismiss();
        this.loading = false;
      } else {
        event.target.complete();
      }
    }
  }

  async getLaporanHarianData(date?: string) {
    const dateToFetch = date
      ? formatDate(date, 'yyyy-MM-dd', 'en-US')
      : formatDate(this.selectedDate, 'yyyy-MM-dd', 'en-US');
    console.log(`Mengambil laporan harian untuk tanggal (API call): ${dateToFetch}`);

    this.tamuLaporanService.getLaporanHarian(dateToFetch).subscribe({
      next: (data: LaporanHarianResponse) => {
        this.laporanHarian = data;
        console.log('Laporan Harian Diterima:', this.laporanHarian);
        if (data.status === 'success' && (!data.data || data.data.length === 0)) {
          this.presentToast('Tidak ada data tamu untuk tanggal ini.', 'warning');
        }
      },
      error: (err: any) => {
        console.error('Error mengambil laporan harian:', err);
        this.laporanHarian = {
          status: 'error',
          message: 'Error memuat data.',
          total_tamu: 0,
          data: [],
        };
        this.presentToast('Error memuat laporan harian.', 'danger');
      },
    });
  }

  onDateChange() {
    console.log('Tanggal yang dipilih dari picker (onDateChange):', this.selectedDate);
    this.getLaporanHarianData();
  }

  async getRekapMingguanData() {
    console.log('Mengambil rekap mingguan...');
    this.tamuLaporanService.getRekapMingguan().subscribe({
      next: (data: RekapMingguanResponse) => {
        this.rekapMingguan = data;
        console.log('Rekap Mingguan Diterima:', this.rekapMingguan);
        if (data.status === 'success' && (!data.data || data.data.length === 0)) {
          this.presentToast('Tidak ada data rekap mingguan.', 'warning');
        }
      },
      error: (err: any) => {
        console.error('Error mengambil rekap mingguan:', err);
        this.rekapMingguan = { status: 'error', message: 'Error memuat data.', data: [] };
        this.presentToast('Error memuat rekap mingguan.', 'danger');
      },
    });
  }

  get totalTamuMingguan(): number {
    return (
      this.rekapMingguan?.data?.reduce(
        (sum, item) => sum + (item.total_tamu_mingguan ?? 0),
        0
      ) ?? 0
    );
  }

  async getRekapBulananData() {
    console.log(`Mengambil rekap bulanan untuk tahun: ${this.selectedYearMonthly}`);
    this.tamuLaporanService.getRekapBulanan(this.selectedYearMonthly).subscribe({
      next: (data: RekapBulananResponse) => {
        this.rekapBulanan = data;
        console.log('Rekap Bulanan Diterima:', this.rekapBulanan);
        this.filterMonthlyData();
        if (data.status === 'success' && (!data.data || data.data.length === 0)) {
          this.presentToast(
            `Tidak ada data rekap bulanan untuk tahun ${this.selectedYearMonthly}.`,
            'warning'
          );
        }
      },
      error: (err: any) => {
        console.error('Error mengambil rekap bulanan:', err);
        this.rekapBulanan = { status: 'error', message: 'Error memuat data.', data: [] };
        this.filteredRekapBulanan = [];
        this.totalTamuPerSelectedMonth = 0;
        this.presentToast('Error memuat rekap bulanan.', 'danger');
      },
    });
  }

  filterMonthlyData() {
    if (!this.rekapBulanan || !this.rekapBulanan.data) {
      this.filteredRekapBulanan = [];
      this.totalTamuPerSelectedMonth = 0;
      return;
    }

    const monthNumber = new Date(this.selectedMonth).getMonth() + 1;
    this.filteredRekapBulanan = this.rekapBulanan.data.filter(
      (item) => item.bulan_angka === monthNumber
    );

    this.totalTamuPerSelectedMonth =
      this.filteredRekapBulanan.reduce(
        (sum, item) => sum + (item.total_tamu_masuk ?? 0),
        0
      ) ?? 0;

    if (this.filteredRekapBulanan.length === 0) {
      this.presentToast(
        `Tidak ada data tamu untuk bulan ${formatDate(this.selectedMonth, 'MMMM', 'en-US')} tahun ${this.selectedYearMonthly}.`,
        'warning'
      );
    }
  }

  onMonthlyYearChange() {
    this.getRekapBulananData();
  }

  onMonthlyMonthChange() {
    this.filterMonthlyData();
  }

  async getRekapTahunanData(year?: number) {
    const yearToFetch = year || this.selectedYear;
    console.log(`Mengambil rekap tahunan untuk tahun: ${yearToFetch}`);
    this.tamuLaporanService.getRekapTahunan(yearToFetch).subscribe({
      next: (data: RekapTahunanResponse) => {
        this.rekapTahunan = data;
        console.log('Rekap Tahunan Diterima:', this.rekapTahunan);
        if (
          data.status === 'success' &&
          (!data.data || data.data.length === 0 || data.data[0].total_tamu_masuk === 0)
        ) {
          this.presentToast(
            `Tidak ada data rekap tahunan untuk tahun ${yearToFetch}.`,
            'warning'
          );
        }
      },
      error: (err: any) => {
        console.error('Error mengambil rekap tahunan:', err);
        this.rekapTahunan = { status: 'error', message: 'Error memuat data.', data: [] };
        this.presentToast('Error memuat rekap tahunan.', 'danger');
      },
    });
  }

  get totalTamuTahunan(): number {
    return this.rekapTahunan?.data?.[0]?.total_tamu_masuk ?? 0;
  }

  onYearlyYearChange() {
    this.getRekapTahunanData(this.selectedYear);
  }

  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'bottom',
    });
    toast.present();
  }
}
