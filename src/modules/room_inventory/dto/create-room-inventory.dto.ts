// create-room-inventory.dto.ts
import { IsNumber, IsDateString, IsOptional } from 'class-validator';

export class CreateRoomInventoryDto {
  @IsNumber({}, { message: 'room_type_id phải là số' })
  room_type_id: number;

  @IsDateString(
    {},
    { message: 'Ngày (date) phải đúng định dạng ISO (YYYY-MM-DD)' },
  )
  date: string;

  @IsNumber({}, { message: 'Số lượng phòng (allotment) phải là số' })
  allotment: number;

  @IsNumber({}, { message: 'Giá phòng (price) phải là số' })
  @IsOptional()
  price?: number;
}
