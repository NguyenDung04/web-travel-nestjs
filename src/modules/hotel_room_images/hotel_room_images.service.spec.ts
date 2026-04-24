import { Test, TestingModule } from '@nestjs/testing';
import { HotelRoomImagesService } from './hotel_room_images.service';

describe('HotelRoomImagesService', () => {
  let service: HotelRoomImagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HotelRoomImagesService],
    }).compile();

    service = module.get<HotelRoomImagesService>(HotelRoomImagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
