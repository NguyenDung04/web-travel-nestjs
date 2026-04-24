import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Hotel } from './hotel.entity';
import { Booking } from './booking.entity';
import { RoomInventory } from './room-inventory.entity';

@Entity({ name: 'room_types' })
export class RoomType {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Hotel, (hotel) => hotel.roomTypes)
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'base_price', type: 'decimal', precision: 12, scale: 2 })
  base_price: number;

  @Column({ name: 'max_guests', default: 2 })
  maxGuests: number;

  @Column({ name: 'bed_type', type: 'varchar', length: 100, nullable: true })
  bedType?: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // 🧩 Cột dùng để đánh dấu đã xóa mềm
  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @OneToMany(() => Booking, (booking) => booking.roomType)
  bookings: Booking[];

  @OneToMany(() => RoomInventory, (inv) => inv.room_type)
  inventory: RoomInventory[];
}
