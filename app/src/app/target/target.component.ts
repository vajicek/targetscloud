import { Component } from '@angular/core';
import { ViewChild, ElementRef, AfterViewInit } from '@angular/core';

class Point {
  constructor(
    public x: number = 0,
    public y: number = 0
  ) {
  }
}

class Hit {
  constructor(
    public set: number = 0,
    public coord: Point = new Point(0, 0)
  ) {
  }
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

  public hits: Array<Hit> = new Array<Hit>();

  onSvgClick(event: MouseEvent) {
    const x = event.clientX;
    const y = event.clientY;
    const w = this.svgElement.nativeElement.width.baseVal.value;
    const h = this.svgElement.nativeElement.height.baseVal.value;

    this.hits.push(new Hit(0, new Point(x / w, y / h)));
    //console.log(event.target);
    console.log(`this.svgElement.nativeElement.width ${this.svgElement.nativeElement.width.baseVal.value}`);
    console.log(`this.svgElement.nativeElement.height ${this.svgElement.nativeElement.height.baseVal.value}`);
    console.log(`Cursor coordinates: (${x}, ${y})`);
  }
}
