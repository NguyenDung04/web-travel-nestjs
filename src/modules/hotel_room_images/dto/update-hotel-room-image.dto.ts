// update-hotel-room-image.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateHotelRoomImageDto } from './create-hotel-room-image.dto';

export class UpdateHotelRoomImageDto extends PartialType(
  CreateHotelRoomImageDto,
) {}
