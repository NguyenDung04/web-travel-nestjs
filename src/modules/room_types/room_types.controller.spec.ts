import { Test, TestingModule } from '@nestjs/testing';
import { RoomTypesController } from './room_types.controller';
import { RoomTypesService } from './room_types.service';

describe('RoomTypesController', () => {
  let controller: RoomTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomTypesController],
      providers: [RoomTypesService],
    }).compile();

    controller = module.get<RoomTypesController>(RoomTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
