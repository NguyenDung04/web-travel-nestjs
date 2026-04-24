/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  IsInt,
  IsBoolean,
  IsString,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreatePostMediaDto {
  @Type(() => Number)
  @IsInt({ message: 'post_id phải là số nguyên' })
  @Min(1, { message: 'post_id phải ≥ 1' })
  post_id: number;

  @Type(() => Number)
  @IsInt({ message: 'media_id phải là số nguyên' })
  @Min(1, { message: 'media_id phải ≥ 1' })
  media_id: number;

  // Chấp nhận 'true'/'false' (string) → boolean
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean({ message: 'is_cover phải là kiểu boolean (true/false)' })
  is_cover: boolean;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'caption phải là chuỗi ký tự' })
  @MaxLength(255, { message: 'caption tối đa 255 ký tự' })
  @IsOptional()
  caption?: string;

  @Type(() => Number)
  @IsInt({ message: 'sort_order phải là số nguyên' })
  @Min(0, { message: 'sort_order phải ≥ 0' })
  @IsOptional()
  sort_order?: number;
}
