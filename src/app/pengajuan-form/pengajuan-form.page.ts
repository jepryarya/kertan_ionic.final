import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { PengajuanService, PengajuanSurat } from '../services/pengajuan.service';
import { AuthService, UserData } from '../services/auth.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { format } from 'date-fns';
import { HttpErrorResponse } from '@angular/common/http';

interface SuccessResponse {
  message: string;
  data?: any;
}

// Tambahkan interface ini untuk mendefinisikan struktur objek jenis surat
interface JenisSuratOption {
  value: string; // Nilai yang akan dikirim ke backend (sesuai ENUM DB)
  label: string; // Teks yang akan ditampilkan di UI
}

@Component({
  selector: 'app-pengajuan-form',
  templateUrl: './pengajuan-form.page.html',
  styleUrls: ['./pengajuan-form.page.scss'],
  standalone: false
})
export class PengajuanFormPage implements OnInit {
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;

  activeTab: string = 'form';
  pengajuanForm: FormGroup;
  // **REVISI: Sesuaikan jenisSurat agar value-nya cocok dengan ENUM di DB Anda**
  jenisSurat: JenisSuratOption[] = [
    { value: 'nikah', label: 'Surat Nikah' },
    { value: 'domisili', label: 'Surat Keterangan Domisili' },
    { value: 'ktp', label: 'Surat Pengantar KTP' },
    { value: 'kk', label: 'Surat Pengantar KK' },
    { value: 'lainnya', label: 'Lainnya' }
  ];

  userData: UserData | null = null;
  selectedFileName: string | null = null;
  selectedFile: File | null = null;
  riwayatPengajuan: PengajuanSurat[] = [];
  isLoadingRiwayat: boolean = false; // Flag untuk status loading riwayat

  constructor(
    private fb: FormBuilder,
    private pengajuanService: PengajuanService,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private router: Router
  ) {
    this.pengajuanForm = this.fb.group({
      jenis_surat: ['', Validators.required],
      // Field 'keperluan' dan 'tanggal_diperlukan' telah dihapus dari form group
      keterangan: [''], // Keterangan sekarang opsional
    });
  }

  ngOnInit() {
    this.loadUserData();
    // loadRiwayatPengajuan tidak dipanggil di sini karena akan dipanggil saat user beralih ke tab 'riwayat'
  }

  loadUserData() {
    this.authService.getCurrentUserData().subscribe(user => {
      this.userData = user;
      console.log('User Data Loaded:', this.userData);
    });
  }

  async loadRiwayatPengajuan() {
    this.isLoadingRiwayat = true; // Set loading flag
    const loading = await this.loadingCtrl.create({
      message: 'Memuat riwayat pengajuan...',
    });
    await loading.present();

    this.pengajuanService.getMyPengajuansWarga().pipe(
      finalize(() => {
        loading.dismiss();
        this.isLoadingRiwayat = false; // Reset loading flag
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error memuat riwayat pengajuan:', error);
        let errorMessage = 'Gagal memuat riwayat pengajuan.';

        if (error.status === 403) {
          errorMessage = 'Anda tidak memiliki izin untuk melihat riwayat. Harap login ulang.';
          this.authService.logout(); // Redirect ke halaman login atau trigger logout
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else {
            errorMessage = `Terjadi kesalahan: ${error.status} ${error.statusText || ''}. Silakan coba lagi.`;
        }

        this.presentToast(errorMessage, 'danger');
        return of({ data: [] }); // Kembalikan objek dengan properti data berupa array kosong
      })
    ).subscribe((response: any) => { // Menggunakan 'response' untuk seluruh objek respons
      // Cek apakah response memiliki properti 'data' dan apakah 'data' itu array
      if (response && response.data && Array.isArray(response.data)) {
        this.riwayatPengajuan = response.data.map((item: any) => ({
          ...item,
          status_display: this.getDisplayStatus(item.status || 'menunggu'),
          diajukan_pada: item.created_at ? format(new Date(item.created_at), 'dd MMMM yyyy HH:mm') : 'N/A'
        }));
      } else if (Array.isArray(response)) { // Jika backend langsung mengembalikan array tanpa properti 'data'
          this.riwayatPengajuan = response.map((item: any) => ({
              ...item,
              status_display: this.getDisplayStatus(item.status || 'menunggu'),
              diajukan_pada: item.created_at ? format(new Date(item.created_at), 'dd MMMM yyyy HH:mm') : 'N/A'
          }));
      }
       else {
        console.warn('Format respons riwayat tidak sesuai harapan:', response);
        this.riwayatPengajuan = []; // Pastikan riwayat kosong jika format tidak sesuai
        this.presentToast('Format data riwayat tidak sesuai dari server.', 'warning');
      }
      console.log('Riwayat Pengajuan Loaded:', this.riwayatPengajuan);
    });
  }

  segmentChanged(event: any) {
    this.activeTab = event.detail.value;
    if (this.activeTab === 'riwayat') {
      this.loadRiwayatPengajuan();
    }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        this.presentToast('Ukuran file maksimal 5MB.', 'danger');
        this.removeFile();
        return;
      }
      const fileType = file.type;
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(fileType)) {
        this.presentToast('Format file yang didukung: PDF, JPG, PNG.', 'danger');
        this.removeFile();
        return;
      }
      this.selectedFile = file;
      this.selectedFileName = file.name;
    } else {
      this.removeFile();
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.selectedFileName = null;
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.value = ''; // Clear file input value
    }
  }

  async submitForm() {
    this.pengajuanForm.markAllAsTouched();
    if (this.pengajuanForm.invalid) {
      await this.presentToast('Mohon lengkapi semua data yang wajib diisi.', 'danger');
      return;
    }

    if (!this.selectedFile) {
      await this.presentToast('Lampiran wajib diunggah.', 'danger');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Mengirim pengajuan surat...',
    });
    await loading.present();

    const formData = this.pengajuanForm.value;

    // Menggabungkan semua informasi ke dalam field 'keterangan'
    // Karena 'keperluan' dan 'tanggal_diperlukan' sudah dihapus dari form,
    // combinedKeterangan hanya akan berisi jenis_surat dan keterangan tambahan
    let combinedKeterangan = `Jenis Surat: ${this.jenisSurat.find(j => j.value === formData.jenis_surat)?.label || formData.jenis_surat}\n`;

    if (formData.keterangan) {
      combinedKeterangan += `Keterangan Tambahan: ${formData.keterangan}`;
    }

    const formToUpload = new FormData();
    formToUpload.append('jenis_surat', formData.jenis_surat); // Mengirim value enum
    formToUpload.append('keterangan', combinedKeterangan.trim()); // Kirim combinedKeterangan sebagai 'keterangan'

    if (this.selectedFile) {
      formToUpload.append('attachment', this.selectedFile, this.selectedFileName!);
    }

    this.pengajuanService.createPengajuanWarga(formToUpload).pipe(
      finalize(() => loading.dismiss()),
      catchError(error => {
        console.error('Error saat mengajukan surat:', error);
        let errorMessage = 'Gagal mengajukan surat. Silakan coba lagi.';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.status === 422 && error.error.errors) {
            errorMessage = Object.values(error.error.errors).flat().join('. ');
        } else if (error.status === 401 || error.status === 403) {
            errorMessage = 'Autentikasi gagal atau Anda tidak memiliki izin. Harap login ulang.';
            this.authService.logout(); // Arahkan ke halaman login atau logout
        }
        this.presentToast(errorMessage, 'danger');
        return of(null);
      })
    ).subscribe(async (res: SuccessResponse | null) => {
      if (res && res.message) {
        await this.presentToast(res.message, 'success');
        this.resetForm();
        this.activeTab = 'riwayat';
        this.loadRiwayatPengajuan();
      } else if (res === null) {
        console.log('Pengajuan gagal atau dibatalkan, tidak ada respons.');
      } else {
        await this.presentToast('Pengajuan berhasil namun respons tidak lengkap.', 'warning');
        this.activeTab = 'riwayat';
        this.loadRiwayatPengajuan();
      }
    });
  }

  resetForm() {
    this.pengajuanForm.reset();
    this.removeFile();
    this.pengajuanForm.get('jenis_surat')?.setValue('');
    this.pengajuanForm.get('keterangan')?.setValue(''); // Hanya reset keterangan
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'disetujui':
        return 'success';
      case 'ditolak':
        return 'danger';
      case 'menunggu':
      default:
        return 'warning';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'disetujui':
        return 'checkmark-circle-outline';
      case 'ditolak':
        return 'close-circle-outline';
      case 'menunggu':
      default:
        return 'hourglass-outline';
    }
  }

  getDisplayStatus(status: string): string {
    switch (status) {
      case 'disetujui':
        return 'Disetujui';
      case 'ditolak':
        return 'Ditolak';
      case 'menunggu':
      default:
        return 'Menunggu Persetujuan';
    }
  }

  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    toast.present();
  }

  viewDetails(item: PengajuanSurat) {
    console.log('Lihat detail pengajuan:', item);
    // Di sini Anda bisa menavigasi ke halaman detail pengajuan
    // Misalnya: this.router.navigate(['/pengajuan-detail', item.id]);
  }
}