import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-trainings',
  standalone: true,
  imports: [NgFor, ToolbarComponent],
  templateUrl: './trainings.component.html',
  styleUrl: './trainings.component.css'
})
export class TrainingsComponent {
  arr = Array(15);

  constructor(private router: Router) { }

  onTrainingDetailsClick() {
    this.router.navigate(['/trainingdetail'])
  }

  onAddClick() {
    this.router.navigate(['/newtraining'])
  }
}
