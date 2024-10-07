import { Controller, Get, Param, Query } from '@nestjs/common';
import { ForexService } from './forex.service';

@Controller('forex')
export class ForexController {
  constructor(private readonly forexService: ForexService) {}

  @Get('average-rate')
  async getAverageRate(@Query('pair') pair: string, @Query('start') start: string, @Query('end') end: string) {
    const [currencyFrom, currencyTo] = pair.split('/');
    return this.forexService.getAverageRate(currencyFrom, currencyTo, start, end);
  }

  @Get('closing-rate')
  async getClosingRate(@Query('pair') pair: string, @Query('date') date: string) {
    const [currencyFrom, currencyTo] = pair.split('/');
    return this.forexService.getClosingRate(currencyFrom, currencyTo, date);
  }
}
