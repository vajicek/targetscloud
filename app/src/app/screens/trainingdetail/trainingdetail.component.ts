import { Component } from '@angular/core';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { TargetComponent } from '../../components/target/target.component';

@Component({
  selector: 'app-trainingdetail',
  standalone: true,
  imports: [ToolbarComponent, TargetComponent],
  templateUrl: './trainingdetail.component.html',
  styleUrl: './trainingdetail.component.css'
})
export class TrainingdetailComponent {

}
