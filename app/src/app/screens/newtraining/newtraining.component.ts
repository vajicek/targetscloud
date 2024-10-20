import { Component } from '@angular/core';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-newtraining',
  standalone: true,
  imports: [ToolbarComponent],
  templateUrl: './newtraining.component.html',
  styleUrl: './newtraining.component.css'
})
export class NewtrainingComponent {
  constructor(private router: Router) { }

  onTrainingClick() {
    this.router.navigate(['/training'])
  }
}
