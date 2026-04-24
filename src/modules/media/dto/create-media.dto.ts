import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsInt,
  Min,
} from 'class-validator';

export class CreateMediaDto {
  @IsString({ message: 'Tên ảnh phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên ảnh không được để trống' })
  @MaxLength(255, { message: 'Tên ảnh tối đa 255 ký tự' })
  fileName: string;

  @IsString({ message: 'Cần nhập ảnh trong máy hoặc link ảnh' })
  url: string;

  @IsOptional()
  @IsInt({ message: 'ID người tạo phải là số nguyên' })
  @Min(1, { message: 'ID người tạo phải >= 1' })
  createdBy?: number;
}
