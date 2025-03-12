import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { DataService } from './data.service';
import { CommonModule } from '@angular/common';
import { ChartComponent } from './chart.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';

import {
  GridsterConfig,
  GridsterItem,
  GridsterModule,
} from 'angular-gridster2';

@Component({
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    ScrollingModule,
    MatCardModule,
    ChartComponent,
    MatButtonToggleModule,
    MatButtonModule,
    GridsterModule,
  ],
  selector: 'app-root',
  template: `
    <mat-toolbar class="font-bold" color="primary">
      Rolling Returns
    </mat-toolbar>
    <div class="p-5 bg-slate-900">
      <button mat-stroked-button class="rounded-md" (click)="newChart()">New Chart +</button>
      <gridster [options]="options" class="h-screen bg-transparent">
        @for (item of dashboard; track item.id) {
        <gridster-item
          [item]="item.gridsterItem"
          class="p-2 rounded-lg bg-[#192232]"
        >
          <div class="h-4 dragHandle"></div>
          <app-chart class="w-full h-[calc(100%-16px)] block" />
        </gridster-item>
        }
      </gridster>
    </div>
  `,
  styleUrl: './app.component.scss',
})
export class AppComponent {
  dashboard: { gridsterItem: GridsterItem; id: number }[] = [];
  options: GridsterConfig;

  constructor(protected dataService: DataService) {
    this.options = {
      minRows: 10,
      minCols: 10,
      displayGrid: 'onDrag&Resize',
      draggable: {
        enabled: true,
        dragHandleClass: 'dragHandle',
        ignoreContent: true,
      },
      resizable: { enabled: true },
    };
  }

  newChart() {
    this.dashboard.push({
      gridsterItem: { x: 0, y: 0, rows: 5, cols: 10 },
      id: Date.now(),
    });
  }
}
