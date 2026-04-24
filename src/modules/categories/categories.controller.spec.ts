import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

describe('CategoriesController', () => {
  let controller: CategoriesController;

  const service = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: CategoriesService, useValue: service }],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('GET /categories -> trả {message,data}', async () => {
    service.findAll.mockResolvedValue([{ id: 1 }]);
    const res = await controller.findAll();
    expect(res).toEqual({ message: 'Danh sách categories', data: [{ id: 1 }] });
    expect(service.findAll).toHaveBeenCalled();
  });

  it('GET /categories/:id -> trả {message,data}', async () => {
    service.findOne.mockResolvedValue({ id: 7 });
    const res = await controller.findOne(7);
    expect(res).toEqual({ message: 'Chi tiết category id=7', data: { id: 7 } });
    expect(service.findOne).toHaveBeenCalledWith(7);
  });

  it('POST /categories -> gọi service.create và trả message', async () => {
    service.create.mockResolvedValue({ id: 3 });
    const res = await controller.create({ name: 'Tour' } as any);
    expect(service.create).toHaveBeenCalledWith({ name: 'Tour' });
    expect(res).toEqual({ message: 'Tạo category thành công' });
  });

  it('PATCH /categories/:id -> gọi service.update và trả message', async () => {
    service.update.mockResolvedValue({ id: 2, name: 'New' });
    const res = await controller.update(2, { name: 'New' } as any);
    expect(service.update).toHaveBeenCalledWith(2, { name: 'New' });
    expect(res).toEqual({ message: 'Cập nhật category id=2 thành công' });
  });

  it('DELETE /categories/:id -> gọi service.remove và trả message', async () => {
    service.remove.mockResolvedValue(undefined);
    const res = await controller.remove(9);
    expect(service.remove).toHaveBeenCalledWith(9);
    expect(res).toEqual({ message: 'Xóa category id=9 thành công' });
  });
});
