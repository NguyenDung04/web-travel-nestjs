import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomInventory } from 'src/model/entities/room-inventory.entity';
import { RoomType } from 'src/model/entities/room-type.entity';
import { RoomInventoryService } from './room_inventory.service';
import { RoomInventoryController } from './room_inventory.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RoomInventory, RoomType])],
  controllers: [RoomInventoryController],
  providers: [RoomInventoryService],
  exports: [RoomInventoryService],
})
export class RoomInventoryModule {}
