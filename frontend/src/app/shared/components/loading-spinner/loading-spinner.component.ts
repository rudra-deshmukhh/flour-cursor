import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.scss']
})
export class LoadingSpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() message: string = 'Loading...';
  @Input() overlay: boolean = false;
  @Input() fullScreen: boolean = false;

  get spinnerClass(): string {
    return `spinner-${this.size}`;
  }

  get containerClass(): string {
    const classes = ['loading-container'];
    
    if (this.overlay) {
      classes.push('overlay');
    }
    
    if (this.fullScreen) {
      classes.push('full-screen');
    }
    
    return classes.join(' ');
  }
}