import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return "Hello Stocks!";
  }

  @Get('/tickers')
  getTickers(){
    return this.appService.getTickers()
  }

  @Get('/price-history')
  getPriceHistory(@Query('symbol') symbol: string) {
    return this.appService.getPriceHistory(symbol)
  }

}
