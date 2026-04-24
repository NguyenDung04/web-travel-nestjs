import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  DeleteDateColumn,
} from 'typeorm';
import { RoomType } from './room-type.entity';

@Entity({ name: 'room_inventory' })
export class RoomInventory {
  @PrimaryColumn({ name: 'room_type_id' })
  room_type_id: number;

  @PrimaryColumn({ type: 'date' })
  date: string;

  @Column()
  allotment: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  price: number;

  // 🧩 Cột dùng để đánh dấu đã xóa mềm
  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @ManyToOne(() => RoomType, (roomType) => roomType.inventory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'room_type_id' })
  room_type: RoomType;
}
