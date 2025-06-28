import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

import {
  LaporanHarianResponse,
  RekapMingguanResponse,
  RekapBulananResponse,
  RekapTahunanResponse,
} from '../model/tamu.model';

@Injectable({
  providedIn: 'root',
})
export class TamuLaporanService {
  private BASE_URL_WITH_PREFIX = environment.apiUrl + '/tamu-laporan';

  constructor(private http: HttpClient) {}

  getLaporanHarian(date: string): Observable<LaporanHarianResponse> {
    console.log('Tanggal yang diterima di service:', date);
    const url = `${this.BASE_URL_WITH_PREFIX}/harian/${date}`;
    console.log('Mengirim permintaan laporan harian ke:', url);
    return this.http.get<LaporanHarianResponse>(url);
  }

  getRekapMingguan(): Observable<RekapMingguanResponse> {
    const url = `${this.BASE_URL_WITH_PREFIX}/mingguan`;
    console.log('Mengirim permintaan rekap mingguan ke:', url);
    return this.http.get<RekapMingguanResponse>(url);
  }

  getRekapBulanan(year: number): Observable<RekapBulananResponse> {
    const params = new HttpParams().set('tahun', year.toString());
    const url = `${this.BASE_URL_WITH_PREFIX}/bulanan-rekap`;
    console.log('Mengirim permintaan rekap bulanan ke:', url, params.toString());
    return this.http.get<RekapBulananResponse>(url, { params });
  }

  getRekapTahunan(year: number): Observable<RekapTahunanResponse> {
    const url = `${this.BASE_URL_WITH_PREFIX}/tahunan/${year}`;
    console.log('Mengirim permintaan rekap tahunan ke:', url);
    return this.http.get<RekapTahunanResponse>(url);
  }
}