import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';

@Component({
  selector: 'app-trainings',
  standalone: true,
  imports: [NgFor, ToolbarComponent],
  templateUrl: './trainings.component.html',
  styleUrl: './trainings.component.css'
})
export class TrainingsComponent {
  arr = Array(15);
}
