import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  ReturnDatum,
  ReturnPeriod,
  ReturnPeriodDays,
  ReturnPeriods,
  StockAnalysisPrice,
} from '@rolling-returns/shared';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  baseURL = window.location.hostname == 'localhost' ? '' : '';
  constructor(private http: HttpClient) {}

  getTickers() {
    return this.http.get<string[]>(`${this.baseURL}/api/tickers`);
  }

  getPriceHistory(symbol: string) {
    return this.http.get<StockAnalysisPrice[]>(
      `${this.baseURL}/api/price-history`,
      {
        params: { symbol },
      }
    );
  }

  addReturnsToData(
    prices: StockAnalysisPrice[],
    period: number,
    frequency: number,
    symbol: string,
    data: {
      [key: number]: {
        time: number;
        [key: string]: number;
      };
    }
  ) {
    for (let i = period; i < prices.length; i += frequency) {
      const time = new Date(prices[i].t).valueOf();
      data[time] = {
        ...data[time],
        time,
        ['price' + symbol]: prices[i].a,
        ['returns' + symbol]:
          100 * ((prices[i].a - prices[i - period].a) / prices[i - period].a),
      };
    }
    return data;
  }

  getRollingReturnsAllPeriods(
    prices: StockAnalysisPrice[],
    symbol: string,
    data: { [time: number]: ReturnDatum }
  ) {
    for (
      let count1W = ReturnPeriodDays['1W'],
        count1M = ReturnPeriodDays['1M'],
        count3M = ReturnPeriodDays['3M'],
        count6M = ReturnPeriodDays['6M'],
        count1Y = ReturnPeriodDays['1Y'],
        countLeading = 0;
      count1W < prices.length;
      count1W += 1,
        count1M += 1,
        count3M += 1,
        count6M += 1,
        count1Y += 1,
        countLeading += 1
    ) {
      const t1W = new Date(prices[count1W].t).valueOf();
      data[t1W] = {
        ...data[t1W],
        time: t1W,
        [symbol + 'price']: prices[count1W].a,
        [symbol + '1W']: this.calculateReturn(prices, count1W, '1W'),
      };
      if (count1M < prices.length) {
        const t1M = new Date(prices[count1M].t).valueOf();
        data[t1M] = {
          ...data[t1M],
          [symbol + '1M']: this.calculateReturn(prices, count1M, '1M'),
        };
      }
      if (count3M < prices.length) {
        const t3M = new Date(prices[count3M].t).valueOf();
        data[t3M] = {
          ...data[t3M],
          [symbol + '3M']: this.calculateReturn(prices, count3M, '3M'),
        };
      }
      if (count6M < prices.length) {
        const t6M = new Date(prices[count6M].t).valueOf();
        data[t6M] = {
          ...data[t6M],
          [symbol + '6M']: this.calculateReturn(prices, count6M, '6M'),
        };
      }
      if (count1Y < prices.length) {
        const t1Y = new Date(prices[count1Y].t).valueOf();
        data[t1Y] = {
          ...data[t1Y],
          [symbol + '1Y']: this.calculateReturn(prices, count1Y, '1Y'),
        };
      }
    }
    return data;
  }

  attempt(
    prices: StockAnalysisPrice[],
    symbol: string,
    data: { [time: number]: ReturnDatum }
  ) {
    for (let count = 0; count < prices.length; count += 1) {
      const time = new Date(prices[count].t).valueOf();
      data[time] = {
        ...data[time],
        time,
        [symbol + 'price']: prices[count].a,
      };
      ReturnPeriods.forEach((period) => {
        if (count + ReturnPeriodDays[period] < prices.length) {
          const tRolling = new Date(
            prices[count + ReturnPeriodDays[period]].t
          ).valueOf();
          const percentReturn =
            100 *
            ((prices[count + ReturnPeriodDays[period]].a - prices[count].a) /
              prices[count].a);
          data[time] = {
            ...data[time],
            [symbol + period + 'leading']: percentReturn,
          };
          data[tRolling] = {
            ...data[tRolling],
            [symbol + period]: percentReturn,
          };
        }
      });
    }
    return data;
  }

  private calculateReturn(
    prices: StockAnalysisPrice[],
    dateIndex: number,
    returnPeriod: ReturnPeriod
  ) {
    return prices[dateIndex]
      ? 100 *
          ((prices[dateIndex].a -
            prices[dateIndex - ReturnPeriodDays[returnPeriod]].a) /
            prices[dateIndex - ReturnPeriodDays[returnPeriod]].a)
      : undefined;
  }
}
