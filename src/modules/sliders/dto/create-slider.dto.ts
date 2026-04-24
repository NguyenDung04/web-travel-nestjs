/* eslint-disable @typescript-eslint/no-unsafe-return */
// src/model/dto/sliders/create-slider.dto.ts
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  IsUrl,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateSliderDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Tiêu đề (title) phải là chuỗi ký tự' })
  @IsOptional()
  title?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'mediaId phải là số' })
  @Min(1, { message: 'mediaId phải >= 1' })
  mediaId: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsUrl({}, { message: 'Đường dẫn (linkUrl) phải là URL hợp lệ' })
  linkUrl?: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({}, { message: 'postId phải là số' })
  @Min(1, { message: 'postId phải >= 1' })
  postId?: number;

  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsOptional()
  @IsBoolean({ message: 'isShow phải là kiểu boolean (true/false)' })
  isShow?: boolean;
}
