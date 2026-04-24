// create-room-type.dto.ts
import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateRoomTypeDto {
  @IsNumber({}, { message: 'hotel_id phải là số' })
  hotel_id: number;

  @IsString({ message: 'Tên loại phòng (name) phải là chuỗi ký tự' })
  name: string;

  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  @IsOptional()
  description?: string;

  @IsNumber({}, { message: 'Giá cơ bản (base_price) phải là số' })
  base_price: number;

  @IsNumber({}, { message: 'Số khách tối đa (max_guests) phải là số' })
  max_guests: number;

  @IsString({ message: 'Loại giường (bed_type) phải là chuỗi ký tự' })
  @IsOptional()
  bed_type?: string;

  @IsBoolean({
    message: 'Trạng thái (is_active) phải là kiểu boolean (true/false)',
  })
  @IsOptional()
  is_active?: boolean;
}
