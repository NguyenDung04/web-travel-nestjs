import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { Media } from './media.entity';
import { Post } from './post.entity';
import { UserStatus } from 'src/common/constants/user-status.enum';
import { Exclude } from 'class-transformer';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Role, (role) => role.users, {
    eager: true,
    nullable: true, // cho phép null
    onDelete: 'SET NULL', // khi xóa role thì user.role = null
  })
  @JoinColumn({ name: 'role_id' })
  role: Role | null;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Exclude({ toPlainOnly: true })
  @Column({ name: 'password', length: 255, select: false })
  password: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.INACTIVE, // user mới mặc định chưa kích hoạt
  })
  status: UserStatus;

  @Column({ name: 'last_login_at', type: 'datetime', nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 🧩 Cột dùng để đánh dấu đã xóa mềm
  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @OneToMany(() => Media, (media) => media.createdBy)
  media: Media[];

  @OneToMany(() => Post, (post) => post.createdBy)
  posts: Post[];
}
