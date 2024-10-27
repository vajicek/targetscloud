import { Component } from '@angular/core';
import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { TargetComponent, Set, Hit } from '../../components/target/target.component';
import { ProfileService } from "../../services/profile.service";
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-training',
  standalone: true,
  imports: [ToolbarComponent, TargetComponent],
  templateUrl: './training.component.html',
  styleUrl: './training.component.css'
})
export class TrainingComponent {

  public training: Array<Set> = new Array<Set>();

  ngOnInit(): void {
    var trainingNo = Number(this.route.snapshot.paramMap.get('training'));

    var sets = this.profileService.trainings()[trainingNo].sets;
    if (sets != undefined) {
      sets.forEach((trainingSet) => {
        var hits = Array<Hit>();
        trainingSet.hits.forEach((hit) => {
          hits.push({ dist: hit.dist, angle: hit.angle });
        });
        this.training.push({ hits: hits });
      });
    }

  }

  constructor(private route: ActivatedRoute,
              private profileService: ProfileService) { }

}
