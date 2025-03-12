export interface StockAnalysisPrice {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  a: number;
  ch: number;
}

export interface StockAnalysisHistoryAPIResponse {
  status: number;
  data: StockAnalysisPrice[];
}

export const ReturnPeriods = ['1W', '1M', '3M', '6M', '1Y'] as const;

export type ReturnPeriod = (typeof ReturnPeriods)[number];

export const ReturnPeriodDays: { [key in ReturnPeriod]: number } = {
  '1W': 5,
  '1M': 21,
  '3M': 63,
  '6M': 126,
  '1Y': 251,
};

export interface ReturnDatum {
  time: number;
  [key: string]: number | undefined;
}
