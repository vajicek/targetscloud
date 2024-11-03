import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ViewChild, ElementRef } from '@angular/core';
import { Observable } from 'rxjs';

export interface Hit {
  dist: number;
  angle: number;
  points: number;
}

export interface Set {
  hits: Array<Hit>;
}

@Component({
  selector: 'app-target',
  standalone: true,
  imports: [],
  templateUrl: './target.component.html',
  styleUrl: './target.component.css'
})
export class TargetComponent {

  @ViewChild('svgElement') svgElement!: ElementRef<SVGSVGElement>;

  @Output() targetHitEvent = new EventEmitter<Hit>();

  @Input()
  set sets(val: Observable<Array<Set>>) {
    this._sets = val;
    this.redraw();
  }
  get sets(): Observable<Array<Set>> {
    return this._sets;
  }

  _sets: Observable<Array<Set>> = new Observable<Array<Set>>();

  @Input()
  set currentSet(val: number) {
    this._currentSet = val;
    this.redraw();
  }
  get currentSet(): number {
    return this._currentSet;
  }

  _currentSet: number = 0;

  ngAfterViewInit() {
    this.redraw();
  }

  redraw() {
    this.sets.subscribe(sets => {
      // remove hits
      var hitsElement = this.svgElement.nativeElement.getElementById("hits");
      while (hitsElement.lastChild) {
        hitsElement.removeChild(hitsElement.lastChild);
      }

      // add hits
      sets.forEach((set, setIndex) => {
        set.hits.forEach((hit, hitIndex) => {
          const x = hit.dist * Math.cos(hit.angle) + 10;
          const y = hit.dist * Math.sin(hit.angle) + 10;

          let newElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          newElement.setAttribute('fill-opacity', String(setIndex / (sets.length - 1)));
          newElement.setAttribute('cx', String(x));
          newElement.setAttribute('cy', String(y));
          newElement.setAttribute('r', '0.4');

          if (setIndex == this.currentSet) {
            newElement.setAttribute('fill', 'green');
          } else {
            newElement.setAttribute('fill', 'orange');
          }

          hitsElement.appendChild(newElement);
        });
      });
    });
  }

  onSvgClick(event: MouseEvent) {
    const w = this.svgElement.nativeElement.width.baseVal.value;
    const h = this.svgElement.nativeElement.height.baseVal.value;

    const rect = this.svgElement.nativeElement.getBoundingClientRect();

    const x = 20 * (event.clientX - rect.left - w / 2) / w;
    const y = 20 * (event.clientY - rect.top - h / 2) / h;

    const distance = Math.sqrt(x ** 2 + y ** 2);
    const angle = Math.atan2(y, x);

    this.targetHitEvent.emit({
      dist: distance,
      angle: angle,
      points: 10 - Math.floor(distance)
    });
  }
}
