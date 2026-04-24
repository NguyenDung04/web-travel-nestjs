// create-hotel-room-image.dto.ts
import { IsNumber, IsBoolean, IsString, IsOptional } from 'class-validator';

export class CreateHotelRoomImageDto {
  @IsNumber({}, { message: 'media_id phải là số' })
  media_id: number;

  @IsNumber({}, { message: 'hotel_id phải là số' })
  @IsOptional()
  hotel_id?: number;

  @IsNumber({}, { message: 'room_type_id phải là số' })
  @IsOptional()
  room_type_id?: number;

  @IsBoolean({ message: 'is_cover phải là kiểu boolean (true/false)' })
  is_cover: boolean;

  @IsString({ message: 'caption phải là chuỗi ký tự' })
  @IsOptional()
  caption?: string;

  @IsNumber({}, { message: 'sort_order phải là số' })
  @IsOptional()
  sort_order?: number;
}
