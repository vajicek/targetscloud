import { ViewChild, ElementRef } from '@angular/core';
import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { ConfirmationDialogComponent } from '../../components/confirmationdialog/confirmationdialog.component';

import { Router } from '@angular/router';
import { ProfileService } from "../../services/profile.service";

@Component({
  selector: 'app-trainings',
  standalone: true,
  imports: [NgFor, ToolbarComponent, ConfirmationDialogComponent],
  templateUrl: './trainings.component.html',
  styleUrl: './trainings.component.css'
})
export class TrainingsComponent {
  @ViewChild(ConfirmationDialogComponent) confirmationDialogComponent!: ConfirmationDialogComponent;

  constructor(private router: Router,
    public profileService: ProfileService) { }

  onTrainingDeleteClick(training_id: String) {
    this.confirmationDialogComponent.confirm(
      "Do you want to delete the training?")
      .then(result => {
        if (result) {
          this.profileService.deleteTraining(training_id)
            .subscribe();
        }
      });
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
