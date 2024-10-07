import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('currency_pairs')
export class CurrencyPair {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 3 })
  currency_from: string;

  @Column({ length: 3 })
  currency_to: string;

  @CreateDateColumn()
  created_at: Date;
}
