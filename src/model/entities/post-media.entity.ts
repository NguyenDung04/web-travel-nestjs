import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Post } from './post.entity';
import { Media } from './media.entity';

@Entity({ name: 'post_media' })
export class PostMedia {
  @PrimaryColumn({ name: 'post_id' })
  postId: number;

  @PrimaryColumn({ name: 'media_id' })
  mediaId: number;

  @Column({ name: 'is_cover', default: false })
  isCover: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  caption?: string | null;

  @Column({ name: 'sort_order', type: 'int', nullable: true })
  sortOrder?: number | null;

  @Column({
    name: 'created_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  // 🧩 Cột dùng để đánh dấu đã xóa mềm
  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @ManyToOne(() => Post, (post) => post.postMedias, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => Media, (media) => media.postMedias, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'media_id' })
  media: Media;
}
