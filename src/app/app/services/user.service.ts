// src/app/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';// <<< PASTIKAN PATH INI BENAR!

@Injectable({
  providedIn: 'root'
})
export class UserService {

  // Mengambil base URL dari environment.ts
  // Asumsi environment.apiUrl adalah 'http://kertan.hexaboy.com/api'
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Mengambil semua user
  getUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/users`); // Menggabungkan base URL dengan endpoint '/users'
  }

  // Mengambil user berdasarkan ID
  getUser(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/${id}`); // Menggabungkan base URL dengan endpoint '/users/{id}'
  }

  // Membuat user baru
  createUser(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/users`, data); // Menggabungkan base URL dengan endpoint '/users'
  }

  // Memperbarui user
  updateUser(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/users/${id}`, data); // Menggabungkan base URL dengan endpoint '/users/{id}'
  }

  // Menghapus user
  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users/${id}`); // Menggabungkan base URL dengan endpoint '/users/{id}'
  }
}