// update-room-inventory.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateRoomInventoryDto } from './create-room-inventory.dto';

export class UpdateRoomInventoryDto extends PartialType(
  CreateRoomInventoryDto,
) {}
