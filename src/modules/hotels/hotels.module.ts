import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HotelsService } from './hotels.service';
import { HotelsController } from './hotels.controller';
import { Hotel } from 'src/model/entities/hotel.entity';
import { RoomType } from 'src/model/entities/room-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Hotel, RoomType])],
  controllers: [HotelsController],
  providers: [HotelsService],
  exports: [HotelsService],
})
export class HotelsModule {}
