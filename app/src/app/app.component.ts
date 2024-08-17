import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ViewChild, ElementRef } from '@angular/core';
import { TargetComponent } from './target/target.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TargetComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'app';

  @ViewChild('targetElement') targetElement!: ElementRef<TargetComponent>;

}
