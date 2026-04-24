import { Test, TestingModule } from '@nestjs/testing';
import { RoomTypesService } from './room_types.service';

describe('RoomTypesService', () => {
  let service: RoomTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoomTypesService],
    }).compile();

    service = module.get<RoomTypesService>(RoomTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
