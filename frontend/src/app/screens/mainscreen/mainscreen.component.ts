import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileService } from "../../services/profile.service";
import { LoginService } from "../../services/login.service";

@Component({
  selector: 'app-mainscreen',
  standalone: true,
  imports: [],
  templateUrl: './mainscreen.component.html',
  styleUrl: './mainscreen.component.css'
})
export class MainScreenComponent {

  constructor(private router: Router,
              private loginService: LoginService,
              public profileService: ProfileService) { }

  onTrainingsClick() {
    this.router.navigate(['/trainings'])
  }

  onFriendsClick() {
    this.router.navigate(['/friends'])
  }

  onGroupsClick() {
    this.router.navigate(['/groups'])
  }

  onSettingsClick() {
    this.router.navigate(['/settings'])
  }

  onLogOutClick() {
    this.loginService.logout();
    this.router.navigate(['/login'])
  }
}
