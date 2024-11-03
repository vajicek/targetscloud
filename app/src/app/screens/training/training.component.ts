import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, map, mergeMap } from 'rxjs';

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

  public training: Observable<Array<Set>> = new Observable<Array<Set>>();
  public currentSetHits: Observable<Array<Hit>> = new Observable<Array<Hit>>();
  public currentSet: number = -1;
  public trainingNo: number = -1;
  public setsCount: number = -1;
  public hitsCount: number = -1;

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

  private getCurrentSetHits(increment: number): Observable<Array<Hit>> {
    return this.training.pipe(map((sets) => {
      // if (sets == undefined) {
      //   return Array<Hit>();
      // }

      if (this.currentSet < 0) {
        this.currentSet = sets.length - 1;
      }

      if ((this.currentSet + increment) >= 0 &&
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
    return this.currentSet < this.setsCount - 1 || this.hitsCount > 0;
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
        this.profileService.deleteHit(this.trainingNo, this.currentSet, hits.length-1)))
      .subscribe(_ => {
        this.training = this.getTraining();
        this.currentSetHits = this.getCurrentSetHits(0);
      });
  }

  public targetHitEvent(hit: Hit) {
    this.profileService.addHit(this.trainingNo, this.currentSet, this.fromHit(hit))
      .subscribe(_ => {
        this.training = this.getTraining();
        this.currentSetHits = this.getCurrentSetHits(0);
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
