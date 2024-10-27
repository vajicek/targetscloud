import { Component, Input } from '@angular/core';
import { ViewChild, ElementRef, AfterViewInit } from '@angular/core';

export interface Hit {
  dist: number;
  angle: number;
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

  @Input() sets: Array<Set> = [];

  ngAfterViewInit() {
    this.sets.forEach((set) => {
      set.hits.forEach((hit) => {

        const x = hit.dist * Math.cos(hit.angle) + 10;
        const y = hit.dist * Math.sin(hit.angle) + 10;

        let newElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        newElement.setAttribute('fill', 'orange');
        newElement.setAttribute('x', String(x));
        newElement.setAttribute('y', String(y));
        newElement.setAttribute('width', '0.2');
        newElement.setAttribute('height', '0.2');
        this.svgElement.nativeElement.appendChild(newElement);
      });
    });
  }

  onSvgClick(event: MouseEvent) {
    // const x = event.clientX;
    // const y = event.clientY;
    // const w = this.svgElement.nativeElement.width.baseVal.value;
    // const h = this.svgElement.nativeElement.height.baseVal.value;

    // this.hits.push(new Hit(0, new Point(x / w, y / h)));
    // //console.log(event.target);
    // console.log(`this.svgElement.nativeElement.width ${this.svgElement.nativeElement.width.baseVal.value}`);
    // console.log(`this.svgElement.nativeElement.height ${this.svgElement.nativeElement.height.baseVal.value}`);
    // console.log(`Cursor coordinates: (${x}, ${y})`);
  }
}
