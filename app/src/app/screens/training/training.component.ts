import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, map } from 'rxjs';

import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import { TargetComponent, Set, Hit } from '../../components/target/target.component';
import { ProfileService, Hit as ProfileHit } from "../../services/profile.service";
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-training',
  standalone: true,
  imports: [ToolbarComponent, TargetComponent, CommonModule],
  templateUrl: './training.component.html',
  styleUrl: './training.component.css'
})
export class TrainingComponent {

  public training?: Observable<Array<Set>>;
  public currentSetHits?: Observable<Array<Hit>>;
  public currentSet: number = -1;
  public trainingNo: number = -1;

  constructor(private route: ActivatedRoute,
    private profileService: ProfileService) { }

  ngOnInit(): void {
    this.trainingNo = Number(this.route.snapshot.paramMap.get('training'));
    this.training = this.getTraining();
    this.currentSetHits = this.getCurrentSetHits(0);
  }

  private getTraining(): Observable<Array<Set>> {
    return this.profileService.trainings()
      .pipe(map((trainings) => {
        var sets = trainings[this.trainingNo].sets;
        if (sets == undefined) {
          return new Array<Set>();
        }
        return sets.map((trainingSet) => {
          return {
            hits: trainingSet.hits.map((hit) => {
              return this.toHit(hit);
            })
          };
        });
      }));
  }

  private getCurrentSetHits(increment: number): Observable<Array<Hit>> | undefined {
    return this.training?.pipe(map((sets) => {
      if (sets == undefined) {
        return Array<Hit>();
      }

      this.currentSet = this.currentSet < 0 ? sets.length - 1 : this.currentSet;

      if ((this.currentSet + increment) > 0 &&
        (this.currentSet + increment) < sets.length) {
        this.currentSet += increment;
      }

      return sets[this.currentSet].hits.map((hit) => {
        return this.toHit(hit);
      });
    }))
  }

  public onAddHit(points: number) {
  }

  public onPrevious() {
    this.currentSetHits = this.getCurrentSetHits(-1);
  }

  public onNext() {
    this.currentSetHits = this.getCurrentSetHits(1);
  }

  public onDeleteLastHit() {
  }

  public targetHitEvent(hit: Hit) {
    this.profileService.addHit(this.trainingNo, this.currentSet, this.fromHit(hit))
      .subscribe(_ => {
        this.training = this.getTraining();
        this.currentSetHits = this.getCurrentSetHits(1);
      });
  }

  private toHit(hit: ProfileHit): Hit {
    return { dist: hit.dist, angle: hit.angle, points: 11 - Math.floor(hit.dist + 1) };
  }

  private fromHit(hit: Hit): ProfileHit {
    return {
      dist: hit.dist,
      angle: hit.angle
    };
  }
}
