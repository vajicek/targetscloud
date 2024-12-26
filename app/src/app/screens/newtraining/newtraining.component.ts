import { Component, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, startWith, map, of, mergeMap, lastValueFrom } from 'rxjs';

import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { ProfileService } from "../../services/profile.service";

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-newtraining',
  standalone: true,
  imports: [
    ToolbarComponent,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,

    // Auto complete
    MatAutocompleteModule,

    // UI Component
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
  ],
  templateUrl: './newtraining.component.html',
  styleUrl: './newtraining.component.css'
})
export class NewTrainingComponent implements OnInit {

  trainingName: string = "";
  selectedTargetType: string = "";
  selectedDistance: string = "";
  selectedSetsConfiguration: string = "";
  collectArrowNumbers: boolean = false;
  collectArrowNotes: boolean = false;

  trainingNameControl = new FormControl('');
  trainingNameFilteredSuggestions: Observable<string[]> = of();

  constructor(private router: Router,
    private profileService: ProfileService) { }

  ngOnInit() {
    this.trainingNameFilteredSuggestions = this.initTrainingNameSuggestions();
  }

  onOkClick() {
    this.profileService.trainings()
      .pipe(mergeMap(async trainings => {
        const _ = await lastValueFrom(this.profileService.addTraining({
          name: this.trainingName,
          targetType: this.selectedTargetType,
          distance: this.selectedDistance,
          setsConfiguration: this.selectedSetsConfiguration,
          collectArrowNumbers: false,
          collectNotes: false
        }));
        this.router.navigate(['/training', { training: trainings.length }]);
      }))
      .subscribe();
  }

  onCancelClick() {
    this.router.navigate(['/trainings'])
  }

  private initTrainingNameSuggestions(): Observable<string[]> {
    return this.trainingNameControl
      .valueChanges
      .pipe(startWith(''), map((value) => this.trainingNameFilter(value || '')),);
  }

  private trainingNameFilter(value: any): any[] {
    const trainingNameSuggestions: string[] = this.getTrainingNameSuggestions();
    const filterValue = value.toLowerCase();
    return trainingNameSuggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(filterValue));
  }

  private getTrainingNameSuggestions(): string[] {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');

    return [`${year}-${month}-${day} training`,
    `${year}-${month}-${day} ${currentDate.getHours() > 12 ? 'afternoon' : 'morning'} training`,
    `${currentDate.getHours() > 12 ? 'Afternoon' : 'Morning'} training`];
  }

}
