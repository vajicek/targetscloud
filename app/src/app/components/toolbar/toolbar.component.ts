import { Component, Attribute } from '@angular/core';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.css'
})
export class ToolbarComponent {
  title: string;
  constructor(@Attribute('title') title: string) {
    this.title = title;
  }

}
