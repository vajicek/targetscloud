import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, mergeMap, map } from 'rxjs';

export interface Hit {
  dist: number;
  angle: number;
}

export interface Set {
  hits: Array<Hit>;
}

export interface Training {
  date: string;
  title: string;
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

  private usersApiUrl = 'http://localhost:8000/api/users';

  private user: Observable<any>;

  constructor(private http: HttpClient) {
    this.user = this.update();
  }

  private update(): Observable<any> {
    return from(new Promise((resolve, reject) => {
      // TODO: load from server or replace in memory for optimization
      this.getUser('0')
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

  private getUser(id: String): Observable<any> {
    // TODO: Add auth token!
    return this.http.get<any>(this.usersApiUrl + "/" + id);
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
      this.usersApiUrl + "/" + user['id'],
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
        10 - Math.floor(hit["dist"])))
      .reduce((accumulator: number, currentValue: number) =>
        accumulator + currentValue, 0);
    return score;
  }

  private toTraining(training: any): Training {
    return {
      date: "1/1/2024",
      title: training["title"],
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
      dist: hit["dist"],
      angle: hit["angle"]
    };
  }
}
