import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HotelRoomImage } from 'src/model/entities/hotel-room-image.entity';
import { Hotel } from 'src/model/entities/hotel.entity';
import { RoomType } from 'src/model/entities/room-type.entity';
import { Media } from 'src/model/entities/media.entity';
import { HotelRoomImagesController } from './hotel_room_images.controller';
import { HotelRoomImagesService } from './hotel_room_images.service';

@Module({
  imports: [TypeOrmModule.forFeature([HotelRoomImage, Hotel, RoomType, Media])],
  controllers: [HotelRoomImagesController],
  providers: [HotelRoomImagesService],
  exports: [HotelRoomImagesService],
})
export class HotelRoomImagesModule {}
