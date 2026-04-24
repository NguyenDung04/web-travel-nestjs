import { Test, TestingModule } from '@nestjs/testing';
import { RoomInventoryController } from './room_inventory.controller';
import { RoomInventoryService } from './room_inventory.service';

describe('RoomInventoryController', () => {
  let controller: RoomInventoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomInventoryController],
      providers: [RoomInventoryService],
    }).compile();

    controller = module.get<RoomInventoryController>(RoomInventoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
