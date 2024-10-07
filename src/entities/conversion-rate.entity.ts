import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { CurrencyPair } from './currency-pair.entity';

@Entity('conversion_rates')
export class ConversionRate {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CurrencyPair, (currencyPair) => currencyPair.id)
  currency_pair_id: number;

  @Column('float')
  rate: number;

  @Column({ type: 'date' })
  rate_date: string;

  @CreateDateColumn()
  created_at: Date;
}
