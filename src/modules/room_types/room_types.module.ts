import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomType } from 'src/model/entities/room-type.entity';
import { Hotel } from 'src/model/entities/hotel.entity';
import { RoomTypesService } from './room_types.service';
import { RoomTypesController } from './room_types.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RoomType, Hotel])],
  controllers: [RoomTypesController],
  providers: [RoomTypesService],
  exports: [RoomTypesService],
})
export class RoomTypesModule {}
