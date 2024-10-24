import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mainscreen',
  standalone: true,
  imports: [],
  templateUrl: './mainscreen.component.html',
  styleUrl: './mainscreen.component.css'
})
export class MainscreenComponent {

  constructor(private router: Router) { }

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
    this.router.navigate(['/login'])
  }
}
