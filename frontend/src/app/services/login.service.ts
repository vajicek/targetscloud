import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable, tap } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(private http: HttpClient, private jwtHelper: JwtHelperService) { }

  private getLoginUrl(): string {
    return environment.apiUrl + '/api/login';
  }

  private getLoginWithGoogleUrl(): string {
    return environment.apiUrl + '/api/loginWithGoogle';
  }

  public login(username: string, password: string): Observable<any> {
    return this.http.post<{ token: string }>(
      `${this.getLoginUrl()}`,
      { username, password })
      .pipe(tap((response: any) => {
        this.setToken(response.token);
      }));
  }

  public loginWithGoogle(token: string): Observable<any> {
    return this.http.post<{ token: string }>(
      `${this.getLoginWithGoogleUrl()}`,
      { token })
      .pipe(tap((response: any) => {
        this.setToken(response.token);
      }));
  }

  public isAuthenticated(): boolean | null | "" {
    const token = this.getToken();
    return token && !this.jwtHelper.isTokenExpired(token);
  }

  public logout() {
    localStorage.removeItem('token');
  }

  public getToken(): string | null {
    return localStorage.getItem('token');
  }

  private setToken(token: string) {
    localStorage.setItem('token', token);
  }

  public getUserId(): string {
    return this.jwtHelper.decodeToken(this.getToken()!)["id"];
  }
}