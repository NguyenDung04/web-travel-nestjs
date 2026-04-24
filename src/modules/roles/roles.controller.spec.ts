import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

describe('RolesController', () => {
  let controller: RolesController;

  const service = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [{ provide: RolesService, useValue: service }],
    }).compile();

    controller = module.get<RolesController>(RolesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('POST /roles -> gọi service.create và trả message', async () => {
    service.create.mockResolvedValue({ id: 1 });
    const res = await controller.create({ name: 'admin' } as any);
    expect(service.create).toHaveBeenCalledWith({ name: 'admin' });
    expect(res).toEqual({ message: 'Tạo role thành công' });
  });

  it('GET /roles -> trả mảng role (controller trả thẳng service)', async () => {
    service.findAll.mockResolvedValue([{ id: 1, name: 'admin' }]);
    const res = await controller.findAll();
    expect(res).toEqual([{ id: 1, name: 'admin' }]);
    expect(service.findAll).toHaveBeenCalled();
  });

  it('GET /roles/:id -> trả role (controller trả thẳng service)', async () => {
    service.findOne.mockResolvedValue({ id: 7, name: 'editor' });
    const res = await controller.findOne(7);
    expect(res).toEqual({ id: 7, name: 'editor' });
    expect(service.findOne).toHaveBeenCalledWith(7);
  });

  it('PATCH /roles/:id -> gọi update và trả message', async () => {
    service.update.mockResolvedValue({ id: 2, name: 'mod' });
    const res = await controller.update(2, { name: 'mod' } as any);
    expect(service.update).toHaveBeenCalledWith(2, { name: 'mod' });
    expect(res).toEqual({ message: 'Cập nhật role thành công' });
  });

  it('DELETE /roles/:id -> trả kết quả từ service.remove', async () => {
    service.remove.mockResolvedValue({
      message: 'Xóa role thành công, tất cả user đã reset role_id = NULL',
    });
    const res = await controller.remove(9);
    expect(service.remove).toHaveBeenCalledWith(9);
    expect(res).toEqual({
      message: 'Xóa role thành công, tất cả user đã reset role_id = NULL',
    });
  });
});
