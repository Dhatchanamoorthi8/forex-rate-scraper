import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForexService } from './forex/forex.service';
import { ForexController } from './forex/forex.controller';
import { CurrencyPair } from './entities/currency-pair.entity';
import { ConversionRate } from './entities/conversion-rate.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([CurrencyPair, ConversionRate]),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'demo',
      entities: [CurrencyPair, ConversionRate],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([CurrencyPair,ConversionRate]),
  ],
  controllers: [ForexController],
  providers: [ForexService],
})
export class AppModule {}
