import { Component, Input, Output, EventEmitter, Renderer2 } from '@angular/core';
import { ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Hit {
  points: number;
  x: number;
  y: number;
}

export interface Set {
  hits: Array<Hit>;
}

export interface TargetSetting {
  targetTemplate: string;
}

@Component({
  selector: 'app-target',
  standalone: true,
  imports: [],
  templateUrl: './target.component.html',
  styleUrl: './target.component.css'
})
export class TargetComponent {

  @ViewChild('targetElement') targetElement!: ElementRef<Element>;

  @Output() targetHitEvent = new EventEmitter<Hit>();

  @Input()
  set sets(val: Array<Set>) {
    this._sets = val;
    this.redraw();
  }
  get sets(): Array<Set> {
    return this._sets;
  }

  _sets: Array<Set> = new Array<Set>();

  @Input()
  set targetSetting(val: TargetSetting) {
    this._targetSetting = val;
  }
  get targetSetting() {
    return this._targetSetting;
  }

  _targetSetting: TargetSetting = { targetTemplate : ""};

  @Input()
  set currentSet(val: number) {
    this._currentSet = val;
    this.redraw();
  }
  get currentSet(): number {
    return this._currentSet;
  }

  _currentSet: number = 0;

  constructor(
    private http: HttpClient,
    private renderer: Renderer2
  ) { }

  ngAfterViewInit() {
    this.loadSvg(this._targetSetting.targetTemplate);
  }

  private loadSvg(filePath: string): void {
    this.http
      .get(filePath, { responseType: 'text' })
      .subscribe({
        next: (svgContent) => {
          this.renderSvg(svgContent);
          this.redraw();
        },
        error: (error) => {
          console.error('Error loading SVG:', error);
        }
      });
  }

  private renderSvg(svgContent: string) {
    const parser = new DOMParser();
    const document = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgElement: HTMLElement = document.documentElement;
    svgElement.onclick = (event) => this.onSvgClick(event, svgElement);
    this.renderer.setStyle(svgElement, "width", "100%");
    this.renderer.setStyle(svgElement, "height", "100%");

    this.targetElement.nativeElement.innerHTML = '';
    this.renderer.appendChild(this.targetElement.nativeElement, svgElement);
  }

  private redraw() {
    if (this.targetElement == undefined) {
      return;
    }

    const svgElement = this.targetElement.nativeElement.querySelector("#target");
    if (svgElement == undefined) {
      return;
    }

    // remove hits
    var hitsElement = svgElement.querySelector("#hits");
    while (hitsElement && hitsElement.lastChild) {
      hitsElement.removeChild(hitsElement.lastChild);
    }

    // add hits
    this._sets.forEach((set, setIndex) => {
      set.hits.forEach((hit, hitIndex) => {
        let newElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        newElement.setAttribute('fill-opacity', String((setIndex + 1) / (this._sets.length - 1)));
        newElement.setAttribute('cx', String(hit.x));
        newElement.setAttribute('cy', String(hit.y));
        newElement.setAttribute('r', '0.4');

        if (setIndex == this.currentSet) {
          newElement.setAttribute('fill', 'green');
        } else {
          newElement.setAttribute('fill', 'orange');
        }

        hitsElement?.append(newElement);
      });
    });
  }

  private onSvgClick(event: MouseEvent, svgElement: Element) {
    const screenSpacePoint = (svgElement as SVGSVGElement).createSVGPoint();
    screenSpacePoint.x = event.clientX;
    screenSpacePoint.y = event.clientY;

    const bestHitZoneNode = this.getBestHitZoneNode(svgElement, screenSpacePoint);
    const transformedPoint = screenSpacePoint.matrixTransform((svgElement as SVGSVGElement).getScreenCTM()?.inverse());

    this.targetHitEvent.emit({
      points: bestHitZoneNode == null ? 0 : this.parseZoneNumber((bestHitZoneNode as SVGGeometryElement).id),
      x: transformedPoint.x,
      y: transformedPoint.y
    });
  }

  private getBestHitZoneNode(svgElement: Element, screenSpacePoint: DOMPoint): SVGGeometryElement | null {
    var bestHitZoneNode: SVGGeometryElement | null = null;

    const zones = svgElement.querySelectorAll('[id^="Zone"]');
    zones.forEach((zone, key, parent) => {
      const zoneElement = (zone as SVGGeometryElement);
      const elementToScreenSpace = zoneElement.getScreenCTM();
      if (elementToScreenSpace) {
        const zoneElementSpacePoint = screenSpacePoint.matrixTransform(elementToScreenSpace.inverse());
        const isInsideFill = zoneElement.isPointInFill(zoneElementSpacePoint);
        if (isInsideFill) {
          if (bestHitZoneNode == null || this.parseZoneNumber(zone.id) > this.parseZoneNumber(bestHitZoneNode.id)) {
            bestHitZoneNode = zoneElement;
          }
        }
      }
    });

    return bestHitZoneNode;
  }

  private parseZoneNumber(input: string): number {
    const match = input.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }
}
