import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  UpdateDateColumn,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Post } from './post.entity';
import { PostMedia } from './post-media.entity';
import { Slider } from './slider.entity';

@Entity({ name: 'media' })
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ type: 'longtext' })
  url: string;

  @ManyToOne(() => User, (user) => user.media)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 🧩 Cột dùng để đánh dấu đã xóa mềm
  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @OneToMany(() => Post, (post) => post.thumbnail)
  posts: Post[];

  @OneToMany(() => PostMedia, (pm) => pm.media)
  postMedias: PostMedia[];

  @OneToMany(() => Slider, (slider) => slider.media)
  sliders: Slider[];
}
