import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastController } from '@ionic/angular';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  showPassword = false;
  emailFilled = false;
  passwordFilled = false;

  showFloatingCard = false;
  isBouncing = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Memeriksa status autentikasi saat halaman dimuat
    this.authService.getAuthStatus().subscribe(isAuthenticated => {
      if (isAuthenticated) {
        // Jika sudah terautentikasi, arahkan ke menu yang sesuai
        this.authService.getCurrentUserData().subscribe(user => {
          if (user) {
            this.redirectToRoleBasedMenu(user.role);
          } else {
            // Jika user data belum ada, coba ambil lagi atau arahkan ke login
            this.router.navigateByUrl('/login', { replaceUrl: true });
          }
        });
      }
    });

    this.checkInput('email');
    this.checkInput('password');
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  checkInput(field: 'email' | 'password') {
    const value = this.loginForm.get(field)?.value;
    if (field === 'email') {
      this.emailFilled = !!value;
    } else {
      this.passwordFilled = !!value;
    }
  }

  toggleFloatingCard() {
    this.showFloatingCard = !this.showFloatingCard;
    this.isBouncing = true;
    setTimeout(() => {
      this.isBouncing = false;
    }, 500);
  }

  closeFloatingCard() {
    this.showFloatingCard = false;
  }

  // FUNGSI LOGIN (Diperbarui untuk API dan navigasi role-based)
  login() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.authService.login({ email, password }).subscribe({
        next: (res) => {
          if (res.success && res.user) {
            // Navigasi setelah login berhasil, berdasarkan role
            this.redirectToRoleBasedMenu(res.user.role);
          }
          // Pesan toast sudah ditangani di authService
        },
        error: (err) => {
          // Error sudah ditangani di authService (via toast)
          console.error('Login error di komponen:', err);
        }
      });
    } else {
      this.presentToast('Mohon lengkapi semua bidang dengan benar.', 'warning');
    }
  }

  // Metode pembantu untuk navigasi berdasarkan role
  private redirectToRoleBasedMenu(role: string) {
    if (role === 'admin2') {
      this.router.navigateByUrl('/admin-menu', { replaceUrl: true });
    } else if (role === 'user') {
      this.router.navigateByUrl('/user-menu', { replaceUrl: true });
    } else {
      // Jika role tidak cocok dengan rute yang diharapkan, arahkan ke login atau halaman default
      this.presentToast('Role Anda tidak memiliki akses ke aplikasi ini.', 'danger');
      this.authService.logout().subscribe(); // Logout jika role tidak diizinkan
    }
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.closeFloatingCard();
      },
      error: (err) => {
        console.error('Logout error di komponen:', err);
      }
    });
  }

  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: color,
      buttons: [
        {
          text: 'Tutup',
          role: 'cancel',
          handler: () => {}
        }
      ]
    });
    toast.present();
  }
}
