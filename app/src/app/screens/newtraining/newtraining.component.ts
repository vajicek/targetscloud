import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, startWith, map, of, mergeMap, lastValueFrom } from 'rxjs';

import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { ProfileService } from "../../services/profile.service";

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-newtraining',
  standalone: true,
  imports: [
    ToolbarComponent,
    CommonModule,
    ReactiveFormsModule,

    // Auto complete
    MatInputModule,
    MatAutocompleteModule,
  ],
  templateUrl: './newtraining.component.html',
  styleUrl: './newtraining.component.css'
})
export class NewTrainingComponent implements OnInit {

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
        const _ = await lastValueFrom(this.profileService.addTraining());
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
