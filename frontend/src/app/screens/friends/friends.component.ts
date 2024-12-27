import { Component } from '@angular/core';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [ToolbarComponent],
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.css'
})
export class FriendsComponent {
  constructor(private router: Router) { }

  onContactClick() {
    this.router.navigate(['/chat'])
  }
}
