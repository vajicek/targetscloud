import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from "../../services/login.service";
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-loginscreen',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './loginscreen.component.html',
  styleUrl: './loginscreen.component.css'
})
export class LoginScreenComponent {
  public username: string = '';
  public password: string = '';

  constructor(private router: Router, private loginService: LoginService) { }

  onSignInClick() {
    console.log("onSignInClick");

    this.loginService.login(this.username, this.password)
      .subscribe({
        next: (response: any) => {
          localStorage.setItem('token', response.token);
          // TODO: user id
          this.router.navigate(['/main'])
        },
        error: (error: any) => {
          alert('Login failed');
        }
      });
  }
}
