import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Hit {
  dist: number;
  angle: number;
}

interface Set {
  hits: Array<Hit>;
}

export interface Training {
  date?: string;
  title?: string;
  score?: number;
  id: string;
  sets?: Array<Set>;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private usersApiUrl = 'http://localhost:8000/api/users';

  private user: any;

  constructor(private http: HttpClient) {
    this.getUser('0')
      .subscribe({
        next: (response) => {
          this.user = response[0];
        },
        error: (error) => {
          console.error('Error fetching data:', error);
        }
      });
  }

  public trainings(): Array<Training> {
    if (this.user == undefined) {
      return new Array<Training>();
    }

    var rerVal: Array<Training> = new Array<Training>();
    var user_trainings = this.user["trainings"];
    for (const training_key in user_trainings) {
      const sets = user_trainings[training_key]["sets"];
      var sets_arr = new Array<Set>();
      for (const set_key in sets) {
        const hits = sets[set_key]["hits"];
        var hits_arr = new Array<Hit>();
        for (const hit_key in hits) {
          const hit = hits[hit_key];
          hits_arr.push({
            dist: hit["dist"],
            angle: hits["angle"]
          });
        }
        sets_arr.push({ hits: hits_arr });
      }
      rerVal.push({
        date: "1/1/2024",
        title: user_trainings[training_key]["title"],
        score: user_trainings[training_key]["score"],
        id: user_trainings[training_key]["id"],
        sets: sets
      });
    }
    return rerVal;
  }

  private getUser(id: String): Observable<any> {
    return this.http.get<any>(this.usersApiUrl + "/" + id);
  }

  public deleteTraining(training_id: String): Observable<any> {
    var index = this.user["trainings"]
      .findIndex((element: any) => element["id"] == training_id);
    this.user["trainings"].splice(index, 1);
    return this.updateUser();
  }

  private updateUser(): Observable<any> {
    return this.http.put<any>(
      this.usersApiUrl + "/" + this.user['id'],
      this.user,
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) });
  }
}
