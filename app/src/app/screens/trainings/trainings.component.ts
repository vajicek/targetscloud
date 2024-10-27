import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { Router } from '@angular/router';
import { ProfileService } from "../../services/profile.service";

@Component({
  selector: 'app-trainings',
  standalone: true,
  imports: [NgFor, ToolbarComponent],
  templateUrl: './trainings.component.html',
  styleUrl: './trainings.component.css'
})
export class TrainingsComponent {

  constructor(private router: Router,
              public profileService: ProfileService) { }

  onTrainingDeleteClick() {
    this.router.navigate(['/trainingdetail'])
  }

  onTrainingEditClick(training_index: number) {
    this.router.navigate(['/training', { training: training_index }])
  }

  onTrainingShowClick() {
    this.router.navigate(['/trainingdetail'])
  }

  onAddClick() {
    this.router.navigate(['/newtraining'])
  }
}
