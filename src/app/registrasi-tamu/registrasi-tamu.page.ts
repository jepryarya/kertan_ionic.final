import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser'; // Tetap diperlukan untuk SafeUrl
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastController, LoadingController, AlertController } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';
// import { environment } from 'src/environments/environment'; // Jika Anda menggunakan file environment

@Component({
  selector: 'app-registrasi-tamu',
  templateUrl: './registrasi-tamu.page.html',
  styleUrls: ['./registrasi-tamu.page.scss'],
  standalone: false
})
export class RegistrasiTamuPage implements OnInit {
  registrasiForm!: FormGroup;
  fotoKtpPreview: SafeUrl | undefined; // Untuk menampilkan pratinjau gambar KTP
  private fotoKtpFile: File | undefined; // Untuk menyimpan objek file gambar KTP

  // Sesuaikan URL ini jika API Laravel Anda tidak berjalan di localhost:8000
  // Atau gunakan environment.apiUrl jika Anda sudah mengaturnya
  private readonly API_BASE_URL = 'https://kertan.hexaboy.com/api'; // Contoh: 'https://your-ngrok-url.ngrok-free.app/api'

  constructor(
    private fb: FormBuilder,
    private sanitizer: DomSanitizer, // Diperlukan untuk SafeUrl
    private http: HttpClient,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.registrasiForm = this.fb.group({
      nama: ['', Validators.required],
      no_identitas: ['', [Validators.required, Validators.maxLength(50)]],
      alamat_asal: ['', Validators.required],
      ke_rumah: ['', Validators.required],
      alasan_kunjungan: ['', Validators.required],
    });
  }

 async takePhoto() {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl, // Mengambil hasil sebagai DataUrl (base64)
      source: CameraSource.Photos // ⬅️ Ubah di sini agar ambil dari galeri saja
    });

    if (image.dataUrl) {
      this.fotoKtpPreview = this.sanitizer.bypassSecurityTrustUrl(image.dataUrl);
      const blob = this.dataURLtoBlob(image.dataUrl);
      // Membuat objek File dari Blob untuk dikirim ke backend
      this.fotoKtpFile = new File([blob], `ktp_${Date.now()}.jpeg`, { type: 'image/jpeg' });
      console.log('Foto KTP berhasil diambil dan dikonversi ke File:', this.fotoKtpFile);
      console.log('Ukuran file fotoKtpFile:', this.fotoKtpFile.size, 'bytes');
      this.presentToast('Foto KTP berhasil dipilih dari galeri.', 'success');
    }
  } catch (error) {
    console.error('Gagal memilih foto dari galeri:', error);
    this.presentToast('Gagal memilih foto. Pastikan izin akses galeri diberikan.', 'danger');
  }
}


  private dataURLtoBlob(dataurl: string): Blob {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  async onSubmit() {
    // 1. Validasi form Angular (data teks)
    if (this.registrasiForm.invalid) {
      this.markAllAsDirty(this.registrasiForm);
      this.presentToast('Mohon lengkapi semua data yang wajib diisi.', 'warning');
      return;
    }

    // 2. Validasi apakah foto KTP sudah diambil
    if (!this.fotoKtpFile) {
        this.presentToast('Mohon ambil foto KTP terlebih dahulu.', 'warning');
        return;
    }

    const loading = await this.loadingController.create({
      message: 'Sedang mendaftarkan tamu...',
    });
    await loading.present();

    // 3. Buat FormData untuk mengirim data teks dan file
    const formData = new FormData();
    const formValues = this.registrasiForm.value;

    for (const key in formValues) {
      if (formValues.hasOwnProperty(key)) {
        formData.append(key, formValues[key]);
      }
    }

    // Tambahkan waktu_masuk (disarankan di backend, tapi jika harus di frontend...)
    formData.append('waktu_masuk', new Date().toISOString());

    // Tambahkan file foto_ktp ke FormData
    formData.append('foto_ktp', this.fotoKtpFile, this.fotoKtpFile.name);

    // 4. Ambil token otentikasi dari Preferences
    const { value: token } = await Preferences.get({ key: 'sanctum-token' });

    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
      console.log('Authorization Header being sent:', headers.get('Authorization'));
    } else {
      console.warn('No token found in Preferences. Request will be unauthenticated.');
    }

    // 5. Kirim permintaan HTTP POST ke API Laravel
    this.http.post(`${this.API_BASE_URL}/registrasi-tamu`, formData, { headers: headers })
      .subscribe({
        next: async (res: any) => {
          await loading.dismiss();
          console.log('Respons API:', res);
          this.presentToast('Registrasi tamu berhasil!', 'success');
          this.registrasiForm.reset();
          this.fotoKtpPreview = undefined; // Hapus pratinjau
          this.fotoKtpFile = undefined; // Hapus objek file
          // Opsional: navigasi ke halaman lain atau tampilkan detail tamu
        },
        error: async (err) => {
          await loading.dismiss();
          console.error('Error saat registrasi tamu:', err);
          let errorMessage = 'Terjadi kesalahan tidak dikenal saat registrasi tamu.';

          if (err.error && err.error.message) {
            errorMessage = err.error.message;
          } else if (err.status === 401) {
            errorMessage = 'Tidak terotentikasi. Silakan login kembali.';
          } else if (err.status === 422 && err.error && err.error.errors) {
            // Tangani error validasi dari Laravel
            errorMessage = 'Validasi gagal:';
            for (const key in err.error.errors) {
              if (err.error.errors.hasOwnProperty(key)) {
                errorMessage += `\n- ${err.error.errors[key].join(', ')}`;
              }
            }
          } else if (err.status === 0) {
            errorMessage = 'Tidak dapat terhubung ke server API. Pastikan server berjalan dan koneksi internet Anda stabil.';
          } else {
              errorMessage = `Error ${err.status}: ${err.statusText || 'Terjadi kesalahan'}. Mohon coba lagi.`;
          }

          this.presentAlert('Registrasi Gagal', errorMessage);
        }
      });
  }

  markAllAsDirty(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsDirty();
      control.updateValueAndValidity();
    });
  }

  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    toast.present();
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