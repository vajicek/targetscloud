import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, mergeMap, map } from 'rxjs';

import { environment } from '../../environments/environment';
import { LoginService } from "./login.service";

import { IUser } from 'model/types';

export interface Hit {
  x: number;
  y: number;
  points: number;
}

export interface Set {
  hits: Array<Hit>;
}

export interface NewTraining {
  name: string;
  targetType: string;
  distance: string;
  setsConfiguration: string;
  collectArrowNumbers: boolean;
  collectNotes: boolean;
}

export interface Training {
  date: string;
  title: string;
  targetType: string;
  distance: string;
  setsConfiguration: string;
  collectArrowNumbers: boolean;
  collectNotes: boolean;
  score: number;
  id: string;
  sets: Array<Set>;
  setsPerTraining: number;
  hitsPerSet: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private user: Observable<any>;

  constructor(private http: HttpClient,
              private loginService: LoginService) {
    this.user = this.update();
  }

  private getUsersApiUrl(): string {
    return environment.apiUrl + '/api/users';
  }

  public refresh() {
    this.user = this.update();
  }

  private update(): Observable<any> {
    return from(new Promise((resolve, reject) => {
      // TODO: load from server or replace in memory for optimization
      this.getUser(this.loginService.getUserId())
        .subscribe({
          next: (response) => {
            resolve(response[0]);
          },
          error: (error) => {
            reject(error);
            console.error('Error fetching data:', error);
          }
        });
    }));
  }

  public trainings(): Observable<Array<Training>> {
    return this.user.pipe(map(user =>
      this.toTrainings(user)));
  }

  public deleteHit(trainingNo: number, setNo: number, hitNo: number): Observable<any> {
    return this.user.pipe(mergeMap(user => {
      user["trainings"][trainingNo]["sets"][setNo]["hits"].splice(hitNo, 1);
      return this.storeUser(user);
    }));
  }

  public addHit(trainingNo: number, setNo: number, hit: Hit): Observable<any> {
    return this.user.pipe(mergeMap(user => {
      user["trainings"][trainingNo]["sets"][setNo]["hits"].push(hit);
      return this.storeUser(user);
    }));
  }

  public addSet(trainingNo: number): Observable<any> {
    return this.user.pipe(mergeMap(user => {
      user["trainings"][trainingNo]["sets"].push({ "hits": [] });
      return this.storeUser(user);
    }));
  }

  private getUser(id: String): Observable<any> {
    return this.http.get<any>(this.getUsersApiUrl() + "/" + id);
  }

  public addTraining(newTraining: NewTraining): Observable<any> {
    return this.user.pipe(mergeMap(user => {
      user["trainings"].length
      user["trainings"].push({
        "id": `${user["trainings"].length}`, //TODO: UUID? empty?
        "timestamp": Date.now(),
        "training_type": "type",
        "title": newTraining.name,
        "target_type": newTraining.targetType,
        "distance": newTraining.distance,
        "sets_configuration": newTraining.setsConfiguration,
        "collect_arrow_numbers": newTraining.collectArrowNumbers,
        "collect_notes": newTraining.collectNotes,
        "score": "1",
        "sets": [{"hits": []}]
      });
      return this.storeUser(user);
    }));
  }

  public deleteTraining(trainingId: String): Observable<any> {
    return this.user.pipe(mergeMap(user => {
      let index = user["trainings"].findIndex((element: any) =>
        element["id"] == trainingId);
      user["trainings"].splice(index, 1);
      return this.storeUser(user);
    }));
  }

  private storeUser(user: any): Observable<any> {
    return this.http.put<any>(
      this.getUsersApiUrl() + "/" + user['id'],
      user,
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) });
  }

  private toTrainings(user: any): Array<Training> {
    let rerVal: Array<Training> = new Array<Training>();
    let userTrainings = user["trainings"];
    for (const trainingKey in userTrainings) {
      rerVal.push(this.toTraining(userTrainings[trainingKey]));
    }
    return rerVal;
  }

  private computeScore(training: any) {
    let sets: any = training["sets"];

    let score = sets.flatMap((set: any) =>
      set["hits"].map((hit: any) =>
        Math.floor(hit["points"])))
      .reduce((accumulator: number, currentValue: number) =>
        accumulator + currentValue, 0);
    return score;
  }

  private toTraining(training: any): Training {
    return {
      date: "1/1/2024",
      title: training["title"],
      targetType: training["target_type"],
      distance: training["distance"],
      setsConfiguration: training["sets_configuration"],
      collectArrowNumbers: training["collect_arrow_numbers"],
      collectNotes: training["collect_notes"],
      score: this.computeScore(training),
      id: training["id"],
      sets: this.toSets(training["sets"]),
      setsPerTraining: 12, // TODO: from userTraining
      hitsPerSet: 3 // TODO: from userTraining
    };
  }

  private toSets(sets: any): Array<Set> {
    let setsArr = new Array<Set>();
    for (const setKey in sets) {
      setsArr.push(this.toSet(sets[setKey]));
    }
    return setsArr;
  }

  private toSet(set: any): Set {
    const hits = set["hits"];
    let hitsArr = new Array<Hit>();
    for (const hitKey in hits) {
      hitsArr.push(this.toHit(hits[hitKey]));
    }
    return { hits: hitsArr };
  }

  private toHit(hit: any): Hit {
    return {
      x: hit.x,
      y: hit.y,
      points: hit.points,
    };
  }
}
