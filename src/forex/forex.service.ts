import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { CurrencyPair } from '../entities/currency-pair.entity';
import { ConversionRate } from '../entities/conversion-rate.entity';

@Injectable()
export class ForexService {
  private readonly logger = new Logger(ForexService.name);

  constructor(
    @InjectRepository(CurrencyPair)
    private readonly currencyPairRepository: Repository<CurrencyPair>,
    @InjectRepository(ConversionRate)
    private readonly conversionRateRepository: Repository<ConversionRate>,
  ) {}

  async getAverageRate(currencyFrom: string, currencyTo: string, start: string, end: string) {
    // Find the currency pair in the database
    const currencyPair = await this.currencyPairRepository.findOne({
      where: { currency_from: currencyFrom, currency_to: currencyTo },
    });

    if (!currencyPair) {
      throw new NotFoundException(`Currency pair ${currencyFrom}/${currencyTo} not found`);
    }

    // Query to get the average rate between start and end dates
    const averageRate = await this.conversionRateRepository
      .createQueryBuilder('conversion_rate')
      .select('AVG(conversion_rate.rate)', 'average')
      .where('conversion_rate.currency_pair_id = :currencyPairId', { currencyPairId: currencyPair.id })
      .andWhere('conversion_rate.rate_date >= :start', { start })
      .andWhere('conversion_rate.rate_date <= :end', { end })
      .getRawOne();

    if (!averageRate || !averageRate.average) {
      throw new NotFoundException(`No conversion rate data found for ${currencyFrom}/${currencyTo} between ${start} and ${end}`);
    }

    return { averageRate: parseFloat(averageRate.average) };
  }

  async getClosingRate(currencyFrom: string, currencyTo: string, date: string) {
    // Find the currency pair in the database
    const currencyPair = await this.currencyPairRepository.findOne({
      where: { currency_from: currencyFrom, currency_to: currencyTo },
    });

    if (!currencyPair) {
      throw new NotFoundException(`Currency pair ${currencyFrom}/${currencyTo} not found`);
    }

    // Retrieve the closing rate for the given date
    const closingRate = await this.conversionRateRepository.findOne({
      where: { currency_pair_id: currencyPair.id, rate_date: date },
      order: { created_at: 'DESC' },  // Get the latest entry for the day if there are multiple
    });

    if (!closingRate) {
      throw new NotFoundException(`No conversion rate data found for ${currencyFrom}/${currencyTo} on ${date}`);
    }

    return { closingRate: closingRate.rate };
  }

  // Fetch conversion rate for a currency pair
  async fetchConversionRate(currencyFrom: string, currencyTo: string): Promise<number> {
    const url = `https://www.xe.com/currencyconverter/convert/?Amount=1&From=${currencyFrom}&To=${currencyTo}`;
    try {
      const response = await axios.get(url);
      // Parse conversion rate from the response
      const rate = this.parseRate(response.data);
      return rate;
    } catch (error) {
      this.logger.error(`Error fetching conversion rate for ${currencyFrom}/${currencyTo}`, error);
      throw error;
    }
  }

  // Parse rate from the HTML response
  private parseRate(html: string): number {
    // Implement your parsing logic here using RegExp or a library like Cheerio
    const match = html.match(/<span class="converterresult-toAmount">(\d+\.\d+)<\/span>/);
    if (!match) {
      throw new Error('Failed to parse conversion rate from HTML');
    }
    return parseFloat(match[1]);
  }

  // Store conversion rate in the database
  async storeConversionRate(currencyPair: CurrencyPair, rate: number, date: string) {
    const conversionRate = new ConversionRate();
    conversionRate.currency_pair_id = currencyPair.id;
    conversionRate.rate = rate;
    conversionRate.rate_date = date;

    await this.conversionRateRepository.save(conversionRate);
  }

  // Method to be triggered daily by a cron job
  async scrapeDailyRates() {
    const currencyPairs = await this.currencyPairRepository.find();
    const today = new Date().toISOString().split('T')[0];

    for (const pair of currencyPairs) {
      const rate = await this.fetchConversionRate(pair.currency_from, pair.currency_to);
      await this.storeConversionRate(pair, rate, today);
      this.logger.log(`Stored conversion rate for ${pair.currency_from}/${pair.currency_to} on ${today}`);
    }
  }
}
