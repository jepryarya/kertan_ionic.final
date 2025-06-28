// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Import HttpHeaders jika diperlukan
import { Observable, BehaviorSubject, throwError, of, from } from 'rxjs'; // <<< ADD 'from' HERE // Tambahkan 'of'
import { tap, catchError, switchMap } from 'rxjs/operators'; // Tambahkan 'switchMap'
import { Preferences } from '@capacitor/preferences';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
 // PERHATIKAN PATH RELATIFNYA!

const TOKEN_KEY = 'sanctum-token';
const USER_DATA_KEY = 'user-data';
const API_URL = environment.apiUrl; // Memastikan ini adalah URL dasar ke backend Anda

export interface UserData {
  id: number;
  name: string;
  email: string;
  role: 'admin2' | 'user';
  // Tambahkan properti lain yang mungkin ada di objek user Anda dari API
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  currentUserData: BehaviorSubject<UserData | null> = new BehaviorSubject<UserData | null>(null);

  constructor(
    private http: HttpClient,
    private toastController: ToastController,
    private router: Router
  ) {
    this.checkTokenAndLoadUserData(); // Memuat token dan data user saat service dimulai
  }

  // Metode awal untuk memeriksa token dan memuat data user
  async checkTokenAndLoadUserData() {
    console.log('AuthService: Running checkTokenAndLoadUserData...');
    const { value: token } = await Preferences.get({ key: TOKEN_KEY });

    if (token) {
      this.isAuthenticated.next(true);
      console.log('AuthService: Token found, authenticating user...');
      // Coba ambil data user dari Preferences dulu (lebih cepat)
      const userDataFromPrefs = await this.getUserDataFromPreferences();
      if (userDataFromPrefs) {
        this.currentUserData.next(userDataFromPrefs);
        console.log('AuthService: User data loaded from Preferences.');
      }

      // Selalu panggil getAuthenticatedUser() untuk memverifikasi token dan menyegarkan data user dari backend
      this.getAuthenticatedUser().subscribe({
        next: (res) => {
          if (res.success && res.user) {
            const userData: UserData = res.user;
            this.currentUserData.next(userData);
            Preferences.set({ key: USER_DATA_KEY, value: JSON.stringify(userData) });
            console.log('AuthService: User data refreshed from API.');
          } else {
            console.warn('AuthService: getAuthenticatedUser API call did not return success or user. Logging out silently.');
            this.logoutSilent();
          }
        },
        error: (err) => {
          console.error('AuthService: Error verifying token with API:', err);
          this.logoutSilent(); // Logout jika verifikasi token gagal
        }
      });
    } else {
      this.isAuthenticated.next(false);
      this.currentUserData.next(null);
      console.log('AuthService: No token found. User not authenticated.');
    }
  }

  // Metode untuk mengambil token dari Preferences
  async getToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: TOKEN_KEY });
    return value;
  }

  // Metode baru untuk mengambil data user dari Preferences (untuk penggunaan async/await di komponen)
  async getUserDataFromPreferences(): Promise<UserData | null> {
    const { value } = await Preferences.get({ key: USER_DATA_KEY });
    if (value) {
      try {
        const userData: UserData = JSON.parse(value);
        return userData;
      } catch (e) {
        console.error('AuthService: Error parsing user data from Preferences:', e);
        return null;
      }
    }
    return null;
  }

  // Metode yang sudah ada untuk mendapatkan BehaviorSubject data user (untuk subscribe)
  getCurrentUserData(): BehaviorSubject<UserData | null> {
    return this.currentUserData;
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    console.log(`AuthService: Attempting login for email: ${credentials.email}`);
    return this.http.post(`${API_URL}/login`, credentials).pipe(
      tap(async (res: any) => {
        if (res.success && res.access_token) {
          await Preferences.set({ key: TOKEN_KEY, value: res.access_token });
          this.isAuthenticated.next(true);
          console.log('AuthService: Login successful, token saved.');

          if (res.user) {
            const userData: UserData = res.user;
            this.currentUserData.next(userData);
            await Preferences.set({ key: USER_DATA_KEY, value: JSON.stringify(userData) });
            console.log('AuthService: User data saved.');
          } else {
            console.warn('AuthService: Login response missing user data.');
          }

          this.presentToast('Login berhasil!', 'success');
          if (res.user && res.user.role === 'admin2') {
            this.router.navigateByUrl('/admin-menu', { replaceUrl: true });
          } else {
            this.router.navigateByUrl('/home', { replaceUrl: true });
          }
        } else {
          console.warn('AuthService: Login response not successful or missing access_token.');
          this.presentToast(res.message || 'Login gagal.', 'danger');
          this.isAuthenticated.next(false);
        }
      }),
      catchError(e => {
        console.error('AuthService: Login API error:', e);
        this.presentToast(e.error?.message || 'Terjadi kesalahan saat login.', 'danger');
        this.isAuthenticated.next(false);
        return throwError(() => e);
      })
    );
  }

  logout(): Observable<any> {
    console.log('AuthService: Attempting logout...');
    const token = this.isAuthenticated.value ? (this.getToken()) : null; // Coba dapatkan token jika isAuthenticated true
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}` // Sertakan token untuk logout
    });

    // Perhatikan: Permintaan logout juga mungkin perlu token
    return this.http.post(`${API_URL}/logout`, {}, { headers }).pipe(
      tap(async () => {
        console.log('AuthService: Logout API call successful.');
        await this.clearAuthData();
        this.presentToast('Logout berhasil!', 'success');
        this.router.navigateByUrl('/login', { replaceUrl: true });
      }),
      catchError(e => {
        console.error('AuthService: Logout API error:', e);
        this.presentToast('Logout gagal. Menghapus sesi lokal.', 'danger');
        this.logoutSilent(); // Tetap hapus data lokal meskipun API error
        return throwError(() => e);
      })
    );
  }

  // Hanya menghapus data autentikasi lokal tanpa memanggil API
  async logoutSilent() {
    console.log('AuthService: Performing silent logout (clearing local data).');
    await this.clearAuthData();
    this.router.navigateByUrl('/login', { replaceUrl: true }); // Arahkan ke login setelah silent logout
  }

  // Helper untuk membersihkan data autentikasi
  private async clearAuthData() {
    await Preferences.remove({ key: TOKEN_KEY });
    await Preferences.remove({ key: USER_DATA_KEY });
    this.isAuthenticated.next(false);
    this.currentUserData.next(null);
  }

  getAuthenticatedUser(): Observable<any> {
    console.log('AuthService: Fetching authenticated user data...');
    return from(this.getToken()).pipe( // Gunakan 'from' untuk mengubah Promise menjadi Observable
        switchMap(token => {
            if (!token) {
                console.warn('AuthService: No token available for getAuthenticatedUser.');
                return throwError(() => new Error('No authentication token.'));
            }
            const headers = new HttpHeaders({
                'Authorization': `Bearer ${token}`
            });
            return this.http.get(`${API_URL}/user`, { headers });
        }),
        tap((res: any) => {
            if (res.success && res.user) {
                const userData: UserData = res.user;
                this.currentUserData.next(userData);
                Preferences.set({ key: USER_DATA_KEY, value: JSON.stringify(userData) });
                console.log('AuthService: getAuthenticatedUser success.');
            } else {
                console.warn('AuthService: getAuthenticatedUser API response not successful or missing user.');
                this.logoutSilent(); // Logout jika respons API tidak valid
            }
        }),
        catchError(e => {
            console.error('AuthService: getAuthenticatedUser API error:', e);
            // Tangani status 401 secara spesifik
            if (e.status === 401 || e.status === 403) {
                console.warn('AuthService: Token invalid or expired (401/403). Performing silent logout.');
                this.logoutSilent(); // Hapus data lokal dan arahkan ke login
            }
            return throwError(() => e);
        })
    );
  }

  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
      buttons: [{ text: 'Tutup', role: 'cancel' }]
    });
    toast.present();
  }

  getAuthStatus(): Observable<boolean> {
    return this.isAuthenticated.asObservable();
  }

  // Ini adalah metode yang akan digunakan oleh PengaduanPage.ts (menggantikan getUserData())
  // Namanya disesuaikan agar lebih jelas asalnya dari Preferences
  async getUserData(): Promise<UserData | null> {
    return this.getUserDataFromPreferences();
  }
}