import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity({ name: 'settings' })
export class Setting {
  @PrimaryColumn({ name: 'key' })
  key: string;

  @Column({ name: 'start_web', type: 'tinyint' })
  start_web: boolean;

  @Column({
    name: 'group_key',
    type: 'enum',
    enum: ['general', 'contact', 'social', 'seo', 'chat', 'i18n'],
  })
  group_key: string;

  @Column({ nullable: true })
  label: string;

  @Column({ name: 'value_string', nullable: true })
  value_string: string;

  @Column({ name: 'value_text', type: 'text', nullable: true })
  value_text: string;

  @Column({ name: 'value_int', nullable: true })
  value_int: number;

  @Column({
    name: 'value_decimal',
    type: 'decimal',
    precision: 20,
    scale: 6,
    nullable: true,
  })
  value_decimal: number;

  @Column({ name: 'value_bool', type: 'tinyint', nullable: true })
  value_bool: boolean;

  @Column({ name: 'value_date', type: 'date', nullable: true })
  value_date: Date;

  @Column({ name: 'value_datetime', type: 'datetime', nullable: true })
  value_datetime: Date;

  @Column({ name: 'value_json', type: 'json', nullable: true })
  value_json: object;

  @Column({
    name: 'input_type',
    type: 'enum',
    enum: [
      'text',
      'textarea',
      'email',
      'phone',
      'url',
      'number',
      'switch',
      'select',
      'json',
    ],
    nullable: true,
  })
  input_type: string;

  @Column({ name: 'is_public', default: true })
  is_public: boolean;

  @Column({ name: 'is_secure', default: false })
  is_secure: boolean;

  @Column({ name: 'sort_order', nullable: true })
  sort_order: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // 🧩 Cột dùng để đánh dấu đã xóa mềm
  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}
