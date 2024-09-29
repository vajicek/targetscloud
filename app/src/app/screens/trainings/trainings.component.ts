import { Component } from '@angular/core';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-trainings',
  standalone: true,
  imports: [NgFor],
  templateUrl: './trainings.component.html',
  styleUrl: './trainings.component.css'
})
export class TrainingsComponent {
  arr = Array(100);
}
