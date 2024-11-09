import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, map, mergeMap } from 'rxjs';

import { ToolbarComponent } from '../../components/toolbar/toolbar.component';
import {
  TargetComponent,
  Set,
  Hit
} from '../../components/target/target.component';
import {
  ProfileService,
  Training,
  Hit as ProfileHit
} from "../../services/profile.service";
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-training',
  standalone: true,
  imports: [ToolbarComponent, TargetComponent, CommonModule],
  templateUrl: './training.component.html',
  styleUrl: './training.component.css'
})
export class TrainingComponent {

  // data
  public training: Observable<Training> = new Observable<Training>();

  // UI

  // target input
  public targetSets: Observable<Array<Set>> = new Observable<Array<Set>>();

  // controls input
  public currentSetHits: Observable<Array<Hit>> = new Observable<Array<Hit>>();
  public currentSet: number = -1;
  public trainingNo: number = -1;
  public setsCount: number = -1;
  public hitsCount: number = -1;
  public setsPerTraining: number = -1;
  public hitsPerSet: number = -1;
  public pointsTotal: number = -1;
  public points: number = -1;

  constructor(private route: ActivatedRoute,
    private profileService: ProfileService) { }

  ngOnInit(): void {
    this.trainingNo = Number(this.route.snapshot.paramMap.get('training'));

    this.training = this.getTraining();

    this.targetSets = this.getTargetSets();
    this.currentSetHits = this.getCurrentSetHits(0);
  }

  private getTraining(): Observable<Training> {
    return this.profileService.trainings()
      .pipe(map((trainings) => {
        return trainings[this.trainingNo];
      }));
  }

  private getTargetSets(): Observable<Array<Set>> {
    return this.training
      .pipe(map((training) => {
        this.setsPerTraining = training.setsPerTraining;
        this.hitsPerSet = training.hitsPerSet;
        this.pointsTotal = training.hitsPerSet * training.setsPerTraining * 10;

        let sets = training.sets.map((trainingSet) => {
          return {
            hits: trainingSet.hits.map((profileHit) => this.toHit(profileHit))
          };
        });

        this.points = sets.flatMap((set) => set.hits.map((hit) => hit.points))
          .reduce((accumulator, currentValue) => accumulator + currentValue, 0);

        return sets;
      }));
  }

  private getCurrentSetHits(increment: number): Observable<Array<Hit>> {
    return this.training.pipe(map((training) => {
      let sets = training.sets;

      if (this.currentSet < 0) {
        this.currentSet = sets.length - 1;
      }

      if (this.currentSet + increment >= sets.length &&
        this.currentSet + increment < this.setsPerTraining) {
        // TODO: this.profileService.addSet(this.trainingNo)
        training.sets.push({
          hits: new Array<Hit>()
        })
        this.currentSet += increment;
      } else if ((this.currentSet + increment) >= 0 &&
        (this.currentSet + increment) < sets.length) {
        this.currentSet += increment;
      }

      this.setsCount = sets.length;
      this.hitsCount = sets[this.currentSet].hits.length;

      return sets[this.currentSet].hits.map((hit) => {
        return this.toHit(hit);
      });
    }))
  }

  public hasPrevious(): boolean {
    return this.currentSet > 0;
  }

  public hasNext(): boolean {
    return this.currentSet < this.setsPerTraining - 1 &&
      this.hitsCount >= this.hitsPerSet &&
      (this.currentSet < this.setsCount - 1 ||
        this.hitsCount > 0);
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
    this.currentSetHits
      .pipe(mergeMap(hits =>
        this.profileService.deleteHit(this.trainingNo, this.currentSet, hits.length - 1)))
      .subscribe(_ => {
        this.targetSets = this.getTargetSets();
        this.currentSetHits = this.getCurrentSetHits(0);
      });
  }

  public targetHitEvent(hit: Hit) {
    if (this.hitsCount >= this.hitsPerSet) {
      return;
    }
    this.profileService.addHit(this.trainingNo, this.currentSet, this.fromHit(hit))
      .subscribe(_ => {
        this.targetSets = this.getTargetSets();
        this.currentSetHits = this.getCurrentSetHits(0);
      });
  }

  private toHit(hit: ProfileHit): Hit {
    return {
      dist: hit.dist,
      angle: hit.angle,
      points: 10 - Math.floor(hit.dist)
    };
  }

  private fromHit(hit: Hit): ProfileHit {
    return {
      dist: hit.dist,
      angle: hit.angle
    };
  }
}
