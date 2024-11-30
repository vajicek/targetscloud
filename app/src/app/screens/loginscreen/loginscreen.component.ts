import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { LoginService } from "../../services/login.service";
import { ProfileService } from "../../services/profile.service";
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

declare const google: any; // To avoid TypeScript errors


@Component({
  selector: 'app-loginscreen',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './loginscreen.component.html',
  styleUrl: './loginscreen.component.css'
})
export class LoginScreenComponent implements OnInit {
  public username: string = '';
  public password: string = '';

  constructor(private router: Router,
              private loginService: LoginService,
              private profileService: ProfileService) { }

  public ngOnInit(): void {
    this.renderGoogleSignInButton();
  }

  public onSignInClick() {
    console.log("onSignInClick");
    this.processLoginResponse(this.loginService.login(this.username, this.password));
  }

  private renderGoogleSignInButton(): void {
    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: this.handleCredentialResponse.bind(this),
    });

    google.accounts.id.renderButton(
      document.getElementById('g_id_signin')!,
      { theme: 'outline', size: 'large' }
    );
    google.accounts.id.prompt();
  }

  private processLoginResponse(loginResponse: Observable<any>) {
    loginResponse.subscribe({
      next: (response: any) => {
        this.profileService.refresh();
        this.router.navigate(['/main'])
      },
      error: (error: any) => {
        alert('Login failed');
      }
    });
  }

  private handleCredentialResponse(response: any): void {
    console.log('handleCredentialResponse');
    this.processLoginResponse(this.loginService.loginWithGoogle(response.credential));
  }
}
