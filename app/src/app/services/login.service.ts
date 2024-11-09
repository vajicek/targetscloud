import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient, private jwtHelper: JwtHelperService) { }

  public login(username: string, password: string): Observable<any> {
    return this.http.post<{ token: string }>(
      `${this.apiUrl}/login`,
      { username, password });
  }

  public isAuthenticated(): boolean | null | "" {
    const token = localStorage.getItem('token');
    return token && !this.jwtHelper.isTokenExpired(token);
  }
}