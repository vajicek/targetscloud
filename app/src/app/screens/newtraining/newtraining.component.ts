import { Component } from '@angular/core';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { Router } from '@angular/router';
import { ProfileService } from "../../services/profile.service";
import { mergeMap, lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-newtraining',
  standalone: true,
  imports: [ToolbarComponent],
  templateUrl: './newtraining.component.html',
  styleUrl: './newtraining.component.css'
})
export class NewTrainingComponent {
  constructor(private router: Router,
    private profileService: ProfileService) { }

  onOkClick() {
    this.profileService.trainings()
      .pipe(mergeMap(async trainings => {
        const _ = await lastValueFrom(this.profileService.addTraining());
        this.router.navigate(['/training', { training: trainings.length }]);
      }))
      .subscribe();
  }

  onCancelClick() {
    this.router.navigate(['/trainings'])
  }
}
