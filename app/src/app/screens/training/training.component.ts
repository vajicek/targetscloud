import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, map, mergeMap, of } from 'rxjs';

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
  public training: Training = {
    date: "string",
    title: "string",
    score: -10,
    id: "string",
    sets: [],
    setsPerTraining: -1,
    hitsPerSet: -1,
  };

  // UI

  // controls input
  public targetSets: Array<Set> = new Array<Set>();
  public currentSetHits: Array<Hit> = new Array<Hit>();
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
    this.getTraining()
      .subscribe();
  }

  private getTraining(): Observable<Training> {
    return this.profileService.trainings()
      .pipe(map((trainings) => {
        this.training = trainings[this.trainingNo];
        this.targetSets = this.getTargetSets();
        this.currentSetHits = this.getCurrentSetHits(0);
        return this.training;
      }));
  }

  private getTargetSets(): Array<Set> {
    this.setsPerTraining = this.training.setsPerTraining;
    this.hitsPerSet = this.training.hitsPerSet;
    this.pointsTotal = this.training.hitsPerSet * this.training.setsPerTraining * 10;

    let sets = this.training.sets.map((trainingSet) => {
      return {
        hits: trainingSet.hits.map((profileHit) => this.toHit(profileHit))
      };
    });

    this.points = sets.flatMap((set) => set.hits.map((hit) => hit.points))
      .reduce((accumulator, currentValue) => accumulator + currentValue, 0);

    return sets;
  }

  private addSetIfNeeded(increment: number) {
    let sets = this.training.sets;
    if (this.currentSet + increment >= sets.length &&
      this.currentSet + increment < this.setsPerTraining) {
      this.currentSet += increment;
      this.profileService.addSet(this.trainingNo)
        .pipe(mergeMap((_) => {
          return this.getTraining();
        }))
        .subscribe();
      return true;
    } else if ((this.currentSet + increment) >= 0 &&
      (this.currentSet + increment) < sets.length) {
      this.currentSet += increment;
    }
    return false;
  }

  private getCurrentSetHits(increment: number): Array<Hit> {
    // initialization
    if (this.currentSet < 0) {
      this.currentSet = this.training.sets.length - 1;
    }

    // add or shift by increment
    if (this.addSetIfNeeded(increment)) {
      return this.currentSetHits;
    }

    let sets = this.training.sets;
    this.setsCount = sets.length;
    this.hitsCount = sets[this.currentSet].hits.length;

    return sets[this.currentSet].hits.map((hit) => {
      return this.toHit(hit);
    });
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
    this.profileService.deleteHit(this.trainingNo, this.currentSet, this.currentSetHits.length - 1)
      .pipe(mergeMap((_) => {
        return this.getTraining();
      }))
      .subscribe();
  }

  public targetHitEvent(hit: Hit) {
    if (this.hitsCount >= this.hitsPerSet) {
      return;
    }
    this.profileService.addHit(this.trainingNo, this.currentSet, this.fromHit(hit))
      .pipe(mergeMap((_) => {
        return this.getTraining();
      }))
      .subscribe();
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
