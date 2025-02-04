// src/shop/shop-item.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity()
export class ShopItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('simple-array')
  images: string[];

  @Column()
  category: string;

  @Index()
  @Column({
    type: 'enum',
    enum: ['available', 'sold', 'reserved'],
    default: 'available'
  })
  status: string;

  @Index()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}