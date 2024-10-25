import { Injectable } from '@angular/core';

interface Training {
  a?: number;
  b?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private arr: Array<Training> = [
    { a: 1, b: "" },
    { a: 1, b: "" }
  ];

  constructor() { }

  public trainings(): Array<Training> {
    return this.arr;
  }

}
