import { Component, Attribute } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.css'
})
export class ToolbarComponent {
  title: string;
  constructor(
      @Attribute('title') title: string,
      private router: Router) {
    this.title = title;
  }

  onMenuClick() {
    this.router.navigate(['/main'])
  }
}
