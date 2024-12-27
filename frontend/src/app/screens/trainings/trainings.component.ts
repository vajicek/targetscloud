import { ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { ConfirmationDialogComponent } from '../../components/confirmationdialog/confirmationdialog.component';
import { ProfileService, Training } from "../../services/profile.service";

@Component({
  selector: 'app-trainings',
  standalone: true,
  imports: [NgFor, ToolbarComponent, ConfirmationDialogComponent, CommonModule],
  templateUrl: './trainings.component.html',
  styleUrl: './trainings.component.css'
})
export class TrainingsComponent {
  @ViewChild(ConfirmationDialogComponent) confirmationDialogComponent!: ConfirmationDialogComponent;

  constructor(private router: Router,
    public profileService: ProfileService) { }

  public trainings: Observable<Array<Training>> = new Observable<Array<Training>>();

  ngOnInit() {
    this.trainings = this.profileService.trainings();
  }

  onTrainingDeleteClick(training_id: String) {
    this.confirmationDialogComponent.confirm(
      "Do you want to delete the training?")
      .then(result => {
        if (result) {
          this.profileService.deleteTraining(training_id)
            .subscribe(_ => {
              this.trainings = this.profileService.trainings();
            });
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
