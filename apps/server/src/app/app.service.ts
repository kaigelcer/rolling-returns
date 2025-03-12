import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { combineLatest, map } from 'rxjs';
import { StockAnalysisHistoryAPIResponse } from '@rolling-returns/shared';

interface StockAnalysisScreenerAPIResponse {
  status: number;
  data: {
    data: {
      [key: string]: { price: number };
    };
  };
}

@Injectable()
export class AppService {
  constructor(private http: HttpService) {}

  getPriceHistory(symbol: string) {
    return this.http
      .get<StockAnalysisHistoryAPIResponse>(
        `https://api.stockanalysis.com/api/symbol/s/${symbol}/history?range=Max&period=Daily`
      )
      .pipe(
        map((response) =>
          response.data.data.sort((t1, t2) => {
            return t1.t.localeCompare(t2.t);
          })
        )
      );
  }

  getTickers() {
    return combineLatest([
      this.http.get<StockAnalysisScreenerAPIResponse>(
        `https://api.stockanalysis.com/api/screener/s/bd/price`
      ),
      this.http.get<StockAnalysisScreenerAPIResponse>(
        `https://api.stockanalysis.com/api/screener/e/bd/price`
      ),
    ]).pipe(
      map(([stocksResponse, etfsResponse]) =>
        [
          ...Object.keys(stocksResponse.data.data.data),
          ...Object.keys(etfsResponse.data.data.data),
        ].sort()
      )
    );
  }
}
