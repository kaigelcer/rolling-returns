import { Component, ElementRef, model, output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMMA, ENTER, SPACE } from '@angular/cdk/keycodes';
import { DataService } from './data.service';
import 'ag-charts-enterprise';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { combineLatest, map, Observable, switchMap } from 'rxjs';
import { ReturnPeriods } from '@rolling-returns/shared';

@Component({
  selector: 'app-chart-controls',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    MatAutocompleteModule,
    MatButtonToggleModule,
    MatButtonModule,
    ScrollingModule,
    MatExpansionModule,
    MatChipsModule,
    MatIconModule,
    MatTabsModule,
    MatCheckboxModule,
    MatSelectModule,
  ],
  template: `
    <mat-expansion-panel class="bg-[#192232] shadow-none">
      <mat-expansion-panel-header>
        <mat-panel-title class="font-bold"> Chart Settings </mat-panel-title>
      </mat-expansion-panel-header>
      <form class="flex flex-row gap-5 mb-4">
        <mat-form-field class="flex-grow">
          <mat-label>Symbol(s)</mat-label>
          <span class="w-full flex flex-row">
            <mat-chip-grid #chipGrid class="flex-grow">
              <mat-chip-row
                *ngFor="let ticker of selectedTickers()"
                (removed)="removeTicker(ticker)"
              >
                {{ ticker }}
                <button matChipRemove>
                  <mat-icon>cancel</mat-icon>
                </button>
              </mat-chip-row>
            </mat-chip-grid>
            <input
              #tickerInput
              type="text"
              placeholder="Symbol"
              name="symbol"
              matInput
              [(ngModel)]="symbolInput"
              [matAutocomplete]="auto"
              [matChipInputFor]="chipGrid"
              [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
              (matChipInputTokenEnd)="addTicker($event)"
            />
          </span>
        </mat-form-field>
        <mat-autocomplete
          #auto="matAutocomplete"
          (optionSelected)="tickerSelected($event)"
        >
          <cdk-virtual-scroll-viewport itemSize="25" class="h-60 w-full">
            <mat-option
              *cdkVirtualFor="let option of symbolAutoOptions$ | async"
              [value]="option"
            >
              {{ option }}
            </mat-option>
          </cdk-virtual-scroll-viewport>
        </mat-autocomplete>
        <mat-form-field>
          <mat-label>Start Date</mat-label>
          <input
            matInput
            name="startDate"
            [matDatepicker]="startDatePicker"
            [(ngModel)]="startDate"
          />
          <mat-datepicker-toggle matIconSuffix [for]="startDatePicker" />
          <mat-datepicker #startDatePicker />
        </mat-form-field>
        <mat-form-field>
          <mat-label>End Date</mat-label>
          <input
            matInput
            name="endDate"
            [matDatepicker]="endDatePicker"
            [(ngModel)]="endDate"
          />
          <mat-datepicker-toggle matIconSuffix [for]="endDatePicker" />
          <mat-datepicker #endDatePicker />
        </mat-form-field>
      </form>
      <mat-form-field>
        <mat-label>Return Periods</mat-label>
        <mat-select
          [(value)]="selectedReturnPeriods"
          [multiple]="true"
          [disabled]="!selectedTickers().length"
        >
          @for (symbol of selectedTickers(); track symbol) {
          <mat-optgroup [label]="symbol">
            @for (returnPeriod of ReturnPeriods; track returnPeriod) {
            <mat-option
              [value]="symbol + returnPeriod"
              (onSelectionChange)="toggleReturnPeriod.emit({symbol, returnPeriod, enabled: $event.source.selected})"
              >{{ returnPeriod }}</mat-option
            >
            }
          </mat-optgroup>
          }
        </mat-select>
      </mat-form-field>
    </mat-expansion-panel>
  `,
  styles: ``,
})
export class ChartControlsComponent {
  separatorKeysCodes: number[] = [ENTER, COMMA, SPACE];
  startDate = model.required<Date>();
  endDate = model.required<Date>();
  symbolInput = model('');
  symbolAdded = output<string>();
  symbolRemoved = output<string>();
  ReturnPeriods = [
    ...ReturnPeriods,
    ...ReturnPeriods.map((period) => period + 'leading'),
    'price'
  ];
  toggleReturnPeriod = output<{
    symbol: string;
    returnPeriod: string;
    enabled: boolean;
  }>();
  selectedReturnPeriods = model<string[]>(['VOO3M']);
  selectedTickers = model<string[]>([]);
  symbolAutoOptions$: Observable<string[]>;
  @ViewChild('tickerInput') tickerInput!: ElementRef<HTMLInputElement>;

  constructor(protected dataService: DataService) {
    this.symbolAutoOptions$ = combineLatest([
      toObservable(this.symbolInput),
    ]).pipe(
      switchMap(([symbolInput]) => {
        return dataService
          .getTickers()
          .pipe(
            map((symbols) =>
              symbols.filter((symbol) =>
                symbol
                  .toLocaleUpperCase()
                  .includes(symbolInput.toLocaleUpperCase())
              )
            )
          );
      })
    );
  }

  addTicker(event: MatChipInputEvent): void {
    const value = (event.value || '').trim().toUpperCase();

    if (value) {
      this.selectedTickers.update((tickers) => [...tickers, value]);
      this.symbolAdded.emit(value);
    }

    event.chipInput.clear();
    this.symbolInput.set('');
    this.selectedReturnPeriods.update((selection) =>
      selection.concat([value + '3M'])
    );
  }

  removeTicker(ticker: string): void {
    console.log(this.selectedTickers());
    const index = this.selectedTickers().indexOf(ticker.toUpperCase());
    console.log(index);
    if (index >= 0) {
      this.symbolRemoved.emit(this.selectedTickers()[index]);
      this.selectedTickers.update((tickers) => {
        tickers.splice(index, 1);
        return tickers;
      });
    }
    this.symbolRemoved.emit(ticker);
  }

  tickerSelected(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.viewValue.toUpperCase();
    this.selectedTickers.update((tickers) => [...tickers, value]);
    this.symbolAdded.emit(value);

    this.tickerInput.nativeElement.value = '';

    this.symbolInput.set('');
    this.selectedReturnPeriods.update((selection) =>
      selection.concat([value + '3M'])
    );
  }
}
