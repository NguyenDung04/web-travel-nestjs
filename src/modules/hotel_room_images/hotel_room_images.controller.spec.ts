import { Test, TestingModule } from '@nestjs/testing';
import { HotelRoomImagesController } from './hotel_room_images.controller';
import { HotelRoomImagesService } from './hotel_room_images.service';

describe('HotelRoomImagesController', () => {
  let controller: HotelRoomImagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HotelRoomImagesController],
      providers: [HotelRoomImagesService],
    }).compile();

    controller = module.get<HotelRoomImagesController>(HotelRoomImagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
