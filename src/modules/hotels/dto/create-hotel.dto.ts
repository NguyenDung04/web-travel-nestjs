// create-hotel.dto.ts
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsEmail,
  Matches,
} from 'class-validator';
import { HotelStatus } from 'src/common/constants/hotel-status.enum';

export class CreateHotelDto {
  @IsString({ message: 'Tên khách sạn phải là chuỗi ký tự' })
  name: string;

  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  @IsOptional()
  description?: string;

  @IsString({ message: 'Địa chỉ phải là chuỗi ký tự' })
  @IsOptional()
  address?: string;

  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @Matches(/^0\d{9,10}$/, {
    message: 'Số điện thoại phải bắt đầu bằng 0 và gồm 10 hoặc 11 chữ số',
  })
  @IsOptional()
  phone?: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsOptional()
  email?: string;

  @IsString({ message: 'Giờ check-in phải là chuỗi ký tự (HH:mm)' })
  @IsOptional()
  checkin_time?: string;

  @IsString({ message: 'Giờ check-out phải là chuỗi ký tự (HH:mm)' })
  @IsOptional()
  checkout_time?: string;

  @IsNumber({}, { message: 'Vĩ độ (latitude) phải là số' })
  @IsOptional()
  latitude?: number;

  @IsNumber({}, { message: 'Kinh độ (longitude) phải là số' })
  @IsOptional()
  longitude?: number;

  @IsEnum(HotelStatus, { message: 'Trạng thái khách sạn không hợp lệ' })
  @IsOptional()
  status?: HotelStatus;
}
