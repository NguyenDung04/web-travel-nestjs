import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';
import { RoomType } from './room-type.entity';
import { Booking } from './booking.entity';

@Entity({ name: 'hotels' })
export class Hotel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'longtext', nullable: true })
  description: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ name: 'checkin_time', type: 'time', nullable: true })
  checkinTime: string;

  @Column({ name: 'checkout_time', type: 'time', nullable: true })
  checkoutTime: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'enum', enum: ['active', 'inactive'], default: 'active' })
  status: string;

  // 🧩 Cột dùng để đánh dấu đã xóa mềm
  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @OneToMany(() => RoomType, (room) => room.hotel)
  roomTypes: RoomType[];

  @OneToMany(() => Booking, (booking) => booking.hotel)
  bookings: Booking[];
}
