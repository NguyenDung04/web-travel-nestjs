/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsNumber,
  Min,
  Max,
  IsDateString,
  MinLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PostStatus } from 'src/common/constants/post-status.enum';
import { PostType } from 'src/common/constants/post-type.enum';

export class CreatePostDto {
  @IsEnum(PostType, { message: 'Loại bài viết (post_type) không hợp lệ' })
  post_type: PostType;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Tiêu đề (title) phải là chuỗi ký tự' })
  @MinLength(2, { message: 'Tiêu đề (title) phải có ít nhất 2 ký tự' })
  title: string;

  // Optional: service sẽ tự build slug nếu thiếu
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Slug phải là chuỗi ký tự' })
  @IsOptional()
  slug?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Tóm tắt (excerpt) phải là chuỗi ký tự' })
  @IsOptional()
  excerpt?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Nội dung (content) phải là chuỗi ký tự' })
  @IsOptional()
  content?: string;

  @Type(() => Number)
  @IsInt({ message: 'thumbnail_id phải là số nguyên' })
  @Min(1, { message: 'thumbnail_id phải ≥ 1' })
  @IsOptional()
  thumbnail_id?: number;

  @IsEnum(PostStatus, { message: 'Trạng thái (status) không hợp lệ' })
  @IsOptional()
  status?: PostStatus;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'SEO title phải là chuỗi ký tự' })
  @IsOptional()
  seo_title?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'SEO description phải là chuỗi ký tự' })
  @IsOptional()
  seo_description?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Địa chỉ phải là chuỗi ký tự' })
  @IsOptional()
  address?: string;

  @IsDateString(
    {},
    { message: 'Ngày xuất bản phải là chuỗi ngày giờ ISO hợp lệ' },
  )
  @IsOptional()
  published_at?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Vĩ độ (latitude) phải là số' })
  @Min(-90, { message: 'Vĩ độ (latitude) phải ≥ -90' })
  @Max(90, { message: 'Vĩ độ (latitude) phải ≤ 90' })
  @IsOptional()
  latitude?: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'Kinh độ (longitude) phải là số' })
  @Min(-180, { message: 'Kinh độ (longitude) phải ≥ -180' })
  @Max(180, { message: 'Kinh độ (longitude) phải ≤ 180' })
  @IsOptional()
  longitude?: number;

  @Type(() => Number)
  @IsInt({ message: 'ID người tạo (created_by) phải là số nguyên' })
  @Min(1, { message: 'ID người tạo (created_by) phải ≥ 1' })
  @IsOptional()
  created_by?: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'taxonomy phải là chuỗi ký tự' })
  @IsOptional()
  taxonomy?: string;

  @Type(() => Number)
  @IsInt({ message: 'primary_category_id phải là số nguyên' })
  @Min(1, { message: 'primary_category_id phải ≥ 1' })
  @IsOptional()
  primary_category_id?: number;
}
