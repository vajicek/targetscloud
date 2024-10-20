import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-loginscreen',
  standalone: true,
  imports: [],
  templateUrl: './loginscreen.component.html',
  styleUrl: './loginscreen.component.css'
})
export class LoginscreenComponent {

  constructor(private router: Router) { }

  onSignInClick() {
    console.log("onSignInClick");
    this.router.navigate(['/main'])
  }
}
