import { Component } from '@angular/core';
import { ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-confirmationdialog',
  standalone: true,
  imports: [],
  templateUrl: './confirmationdialog.component.html',
  styleUrl: './confirmationdialog.component.css'
})
export class ConfirmationDialogComponent {
  @ViewChild('confirmationDialog', { static: false }) confirmationDialog!: ElementRef<HTMLDivElement>;

  message: String = "";
  resultPromiseCallback: any  = null;

  public confirm(message: String) {
    this.message = message;
    this.confirmationDialog.nativeElement.style.display = "flex";
    var self = this;
    return new Promise(function (resolve, reject) {
      self.resultPromiseCallback = resolve;
    });
  }

  public onClickYes() {
    this.confirmationDialog.nativeElement.style.display = "None";
    this.resultPromiseCallback(true);
  }

  public onClickNo() {
    this.confirmationDialog.nativeElement.style.display = "None";
    this.resultPromiseCallback(false);
  }
}
