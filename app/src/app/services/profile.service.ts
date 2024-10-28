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
  sets?: Array<Set>;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private usersApiUrl = 'http://localhost:8000/api/users';

  private arr: Array<Training> = new Array<Training>();

  private user: any;

  constructor(private http: HttpClient) {
    this.getUser('0')
      .subscribe({
        next: (response) => {
          this.user = response[0]
          console.log(this.user);
          this.populateFromApiData(this.user["trainings"])
          //this.updateUser().subscribe();
        },
        error: (error) => {
          console.error('Error fetching data:', error);
        }
      });
  }

  private populateFromApiData(trainings: any) {
    for (const training_key in trainings) {
      const sets = trainings[training_key]["sets"];
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
      this.arr.push({
        date: "1/1/2024",
        title: trainings[training_key]["title"],
        score: trainings[training_key]["score"],
        sets: sets
      });
    }
  }

  private generate() {
    for (var i = 0; i < 100; i++) {
      var sets = new Array<Set>();
      for (var j = 0; j < 10; j++) {
        var hits = new Array<Hit>();
        for (var k = 0; k < 3; k++) {
          hits.push({
            dist: Math.random() * 10,
            angle: Math.random() * 6.28
          });
        }
        sets.push({ hits: hits });
      }

      this.arr.push({
        date: "1/1/2024",
        title: "adsfasdf adsfa sdfad",
        score: 123,
        sets: sets
      });
    }
  }

  public trainings(): Array<Training> {
    return this.arr;
  }

  private getUser(id: String): Observable<any> {
    return this.http.get<any>(this.usersApiUrl + "/" + id);
  }

  private updateUser(): Observable<any> {
    return this.http.put<any>(
      this.usersApiUrl + "/" + this.user['id'],
      this.user,
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) });
  }
}
