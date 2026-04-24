import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Hotel } from './hotel.entity';
import { RoomType } from './room-type.entity';
import { Media } from './media.entity';

@Entity({ name: 'hotel_room_images' })
export class HotelRoomImage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Hotel, (hotel) => hotel.id, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'hotel_id' })
  hotel?: Hotel;

  @ManyToOne(() => RoomType, (room) => room.id, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'room_type_id' })
  roomType?: RoomType;

  @ManyToOne(() => Media, (media) => media.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'media_id' })
  media: Media;

  @Column({ name: 'is_cover', type: 'tinyint', default: 0 })
  isCover: boolean;

  @Column({ nullable: true })
  caption?: string;

  @Column({ name: 'sort_order', nullable: true })
  sortOrder?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // 🧩 Cột dùng để đánh dấu đã xóa mềm
  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
