import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient) {}

  get<T>(endpoint: string, params?: any): Observable<T> {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;
    const httpParams = this.buildParams(params);

    return this.http.get<T>(url, { params: httpParams });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;
    return this.http.post<T>(url, body);
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;
    return this.http.put<T>(url, body);
  }

  patch<T>(endpoint: string, body: any): Observable<T> {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;
    return this.http.patch<T>(url, body);
  }

  delete<T>(endpoint: string): Observable<T> {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;
    return this.http.delete<T>(url);
  }

  private buildParams(params?: any): HttpParams {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return httpParams;
  }
}
