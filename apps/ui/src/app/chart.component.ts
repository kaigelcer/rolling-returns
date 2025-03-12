import { Component, effect, model, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgCharts, AgChartsModule } from 'ag-charts-angular';
import {
  AgCartesianChartOptions,
  AgCartesianSeriesOptions,
} from 'ag-charts-community';
import { DataService } from './data.service';
import 'ag-charts-enterprise';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ChartControlsComponent } from './chart-controls.component';
import { ReturnDatum, ReturnPeriods } from '@rolling-returns/shared';

@Component({
  selector: 'app-chart',
  imports: [
    CommonModule,
    AgChartsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    ChartControlsComponent,
  ],
  template: `
    <div class="flex flex-col gap-5 w-full h-full">
      <app-chart-controls
        [(startDate)]="startDate"
        [(endDate)]="endDate"
        [(selectedTickers)]="symbols"
        (symbolAdded)="loadSymbolData($event)"
        (symbolRemoved)="removeSymbolData($event)"
        (toggleReturnPeriod)="toggleReturnPeriod($event)"
      />
      <ag-charts
        #chart
        [options]="chartOptions"
        class="w-full block flex-grow border border-[#192232]"
      />
    </div>
  `,
})
export class ChartComponent {
  chartOptions: AgCartesianChartOptions;
  symbols = model(['VOO']);
  startDate = model<Date>(
    (() => {
      const currentDate = new Date();
      return new Date(currentDate.setMonth(currentDate.getMonth() - 6));
    })()
  );
  endDate = model<Date>(new Date());
  refreshZoom = signal({});
  zoomEffect = effect(() => {
    this.refreshZoom();
    this.chart?.chart?.setState({
      version: '2',
      zoom: {
        rangeX: {
          start: {
            __type: 'date',
            value: this.startDate()?.getTime(),
          },
          end: { __type: 'date', value: this.endDate()?.getTime() },
        },
      },
    });
  });
  chartDataByDate: { [time: number]: ReturnDatum } = {};
  @ViewChild('chart')
  chart!: AgCharts;

  constructor(private dataService: DataService) {
    this.chartOptions = {
      theme: 'ag-material-dark',
      title: { text: 'Rolling Returns' },
      animation: {
        enabled: true,
      },
      zoom: {
        enabled: true,
        autoScaling: { enabled: true },

        anchorPointX: 'pointer',
        anchorPointY: 'pointer',
      },
      navigator: { enabled: true, miniChart: { enabled: true } },
      legend: { enabled: true },
      axes: [
        { type: 'number', position: 'left' },
        { type: 'number', position: 'right' },
        {
          type: 'time',
          position: 'bottom',
          crosshair: { label: { format: '%d %b %Y' } },
        },
      ],
    };
    this.loadSymbolData('VOO');
  }

  loadSymbolData(symbol: string) {
    this.dataService.getPriceHistory(symbol).subscribe((prices) => {
      this.chartDataByDate = this.dataService.attempt(
        prices,
        symbol,
        this.chartDataByDate
      );
      this.chartOptions = {
        ...this.chartOptions,
        data: Object.values(this.chartDataByDate).sort((t1, t2) => {
          return t1.time - t2.time;
        }),
        axes: [
          {
            type: 'number',
            position: 'left',
            keys: [
              ...(this.chartOptions.axes?.[0]?.keys || []),
              ...ReturnPeriods.flatMap((period) => [
                symbol + period,
                symbol + period + 'leading',
              ]),
            ],
          },
          {
            type: 'number',
            position: 'right',
            keys: [
              ...(this.chartOptions.axes?.[1]?.keys || []),
              symbol + 'price',
            ],
          },
          {
            type: 'time',
            position: 'bottom',
            crosshair: { label: { format: '%d %b %Y' } },
          },
        ],
      };
      setTimeout(() => this.refreshZoom.set({}), 1000);
    });
  }

  getSeries(symbol: string, period: string): AgCartesianSeriesOptions {
    return {
      id: symbol + period,
      title: `${symbol} ${period} Rolling Returns`,
      type: 'line',
      xKey: 'time',
      yKey: symbol + period,
      yName: `${symbol} ${period} Rolling Returns`,
      marker: {
        enabled: false,
      },
      tooltip: {
        renderer: () => {
          return {
            heading: `%CHG${period} (${symbol})`,
            data: [],
          };
        },
      },
    };
  }

  removeSymbolData(symbol: string) {
    const series = this.chartOptions.series?.filter(
      (series) => series.id?.slice(0, symbol.length) != symbol
    );
    this.chartOptions = {
      ...this.chartOptions,
      series,
    };
    setTimeout(() => this.refreshZoom.set({}), 1000);
  }

  toggleReturnPeriod(event: {
    symbol: string;
    returnPeriod: string;
    enabled: boolean;
  }) {
    console.log(event);
    if (event.enabled) {
      this.chartOptions = {
        ...this.chartOptions,
        series: [
          ...(this.chartOptions.series || []),
          this.getSeries(event.symbol, event.returnPeriod),
        ],
      };
    } else {
      const updatedSeries = this.chartOptions.series?.filter(
        (series) => series.id !== event.symbol + event.returnPeriod
      );
      this.chartOptions = {
        ...this.chartOptions,
        series: updatedSeries,
      };
    }
  }
}
